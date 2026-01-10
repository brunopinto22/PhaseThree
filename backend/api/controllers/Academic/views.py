"""
REQ-8-12: Academic Services endpoints
Dashboard and management for staff to view internships, placements, and protocol workflows.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.status import *
from django.db.models import Count, Q
from django.db import transaction
from django.utils import timezone

from api.models import (
    Candidature, CandidatureProposal, CandidatureHistory, Protocol,
    Student, Proposal, Teacher, Calendar, Course, Company, Accounts
)
from api.token_manager import decode_token


def get_user_account(auth_header):
    """Helper to decode token and get user account."""
    user_id, user_email, user_type = decode_token(auth_header)
    
    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return None, None, user_email
    
    try:
        account = Accounts.objects.get(email=user_email)
        return account, user_type, None
    except Accounts.DoesNotExist:
        return None, None, "User not found"


@api_view(["GET"])
def academicDashboard(request):
    """
    REQ-8-12: Academic services dashboard showing overview statistics.
    """
    auth_header = request.headers.get("Authorization")
    account, user_type, error = get_user_account(auth_header)
    
    if error:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)
    
    if user_type not in ["admin", "teacher"]:
        return Response({"message": "Não tem permissão para aceder ao painel académico"}, status=HTTP_403_FORBIDDEN)
    
    try:
        # Get candidature counts by state
        candidature_stats = Candidature.objects.values('state').annotate(count=Count('id_candidature'))
        state_counts = {item['state']: item['count'] for item in candidature_stats}
        
        # Total students with candidatures
        total_students_with_candidatures = Candidature.objects.values('student').distinct().count()
        
        # Pending protocol signatures (simplified - ISEC auto-signs on generation)
        pending_company_signatures = Protocol.objects.filter(
            isec_signed_at__isnull=False,
            company_signed_at__isnull=True
        ).count()
        pending_student_signatures = Protocol.objects.filter(
            isec_signed_at__isnull=False,
            company_signed_at__isnull=False,
            student_signed_at__isnull=True
        ).count()
        
        # Protocol statistics
        total_protocols = Protocol.objects.count()
        completed_protocols = Protocol.objects.filter(
            isec_signed_at__isnull=False,
            company_signed_at__isnull=False,
            student_signed_at__isnull=False
        ).count()
        
        # Active internships (placed or awaiting signatures)
        active_internships = Candidature.objects.filter(
            state__in=['placed', 'awaiting_signatures']
        ).count()
        
        # Finished internships
        finished_internships = Candidature.objects.filter(state='finished').count()
        
        # Proposals statistics
        total_proposals = Proposal.objects.count()
        available_slots = Proposal.objects.aggregate(
            total=Count('id_proposal'),
            filled=Count('students')
        )
        
        # Get recent activity
        recent_history = CandidatureHistory.objects.select_related(
            'candidature__student__user', 'changed_by'
        ).order_by('-changed_at')[:10]
        
        recent_activity = []
        for h in recent_history:
            recent_activity.append({
                "id": h.id,
                "candidature_id": h.candidature.id_candidature,
                "student_name": h.candidature.student.student_name,
                "previous_state": h.previous_state,
                "new_state": h.new_state,
                "changed_at": h.changed_at.isoformat(),
                "changed_by": h.changed_by.email if h.changed_by else "Sistema",
                "notes": h.notes
            })
        
        # Calendars with statistics
        calendars = Calendar.objects.annotate(
            student_count=Count('students_in_calendar'),
            proposal_count=Count('proposals_calendar')
        ).order_by('-calendar_year', '-calendar_semester')[:5]
        
        calendar_data = []
        for c in calendars:
            calendar_data.append({
                "id": c.id_calendar,
                "year": c.calendar_year,
                "semester": c.calendar_semester,
                "course": c.course.course_name if c.course else "N/A",
                "students": c.student_count,
                "proposals": c.proposal_count,
                "start": str(c.submission_start) if c.submission_start else None,
                "end": str(c.placements) if c.placements else None
            })
        
        data = {
            "overview": {
                "total_students": total_students_with_candidatures,
                "active_internships": active_internships,
                "finished_internships": finished_internships,
                "total_proposals": total_proposals
            },
            "candidatures_by_state": {
                "submitted": state_counts.get('submitted', 0),
                "revision": state_counts.get('revision', 0),
                "placed": state_counts.get('placed', 0),
                "awaiting_signatures": state_counts.get('awaiting_signatures', 0),
                "finished": state_counts.get('finished', 0)
            },
            "pending_signatures": {
                "company": pending_company_signatures,
                "student": pending_student_signatures,
                "total": pending_company_signatures + pending_student_signatures
            },
            "protocols": {
                "total": total_protocols,
                "completed": completed_protocols,
                "pending": total_protocols - completed_protocols
            },
            "recent_activity": recent_activity,
            "calendars": calendar_data
        }
        
        return Response(data, status=HTTP_200_OK)
        
    except Exception as e:
        return Response({"message": "Erro ao obter dashboard", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def listPlacements(request):
    """
    REQ-8-12: List all placements with filters.
    """
    auth_header = request.headers.get("Authorization")
    account, user_type, error = get_user_account(auth_header)
    
    if error:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)
    
    if user_type not in ["admin", "teacher"]:
        return Response({"message": "Não tem permissão para ver colocações"}, status=HTTP_403_FORBIDDEN)
    
    try:
        # Base queryset - candidatures with accepted proposals (placed or further)
        candidatures = Candidature.objects.select_related(
            'student__user', 'student__calendar__course'
        ).prefetch_related(
            'candidature_proposals__proposal__company',
            'candidature_proposals__proposal__isec_advisor',
            'candidature_proposals__proposal__company_advisor'
        ).filter(
            state__in=['placed', 'protocol_generated', 'presidency_signature', 
                      'company_signature', 'student_signature', 'finished']
        )
        
        # Apply filters
        state_filter = request.query_params.get('state')
        if state_filter:
            candidatures = candidatures.filter(state=state_filter)
        
        calendar_filter = request.query_params.get('calendar')
        if calendar_filter:
            candidatures = candidatures.filter(student__calendar__id_calendar=calendar_filter)
        
        course_filter = request.query_params.get('course')
        if course_filter:
            candidatures = candidatures.filter(student__calendar__course__id_course=course_filter)
        
        company_filter = request.query_params.get('company')
        if company_filter:
            candidatures = candidatures.filter(
                candidature_proposals__proposal__company__id_company=company_filter,
                candidature_proposals__state='accepted'
            )
        
        data = []
        for c in candidatures:
            # Get accepted proposal
            accepted = c.candidature_proposals.filter(state='accepted').first()
            proposal = accepted.proposal if accepted else None
            
            # Check if protocol exists
            has_protocol = hasattr(c, 'protocol')
            protocol_data = None
            if has_protocol:
                protocol_data = {
                    "id": c.protocol.id_protocol,
                    "number": c.protocol.protocol_number,
                    "isec_signed": c.protocol.isec_signed_at is not None,
                    "company_signed": c.protocol.company_signed_at is not None,
                    "student_signed": c.protocol.student_signed_at is not None
                }
            
            data.append({
                "id": c.id_candidature,
                "state": c.state,
                "state_display": dict(Candidature.STATE_CHOICES).get(c.state, c.state),
                "submission_date": str(c.candidature_submission_date) if c.candidature_submission_date else None,
                "student": {
                    "number": c.student.student_number,
                    "name": c.student.student_name,
                    "email": c.student.user.email
                },
                "calendar": {
                    "id": c.student.calendar.id_calendar,
                    "year": c.student.calendar.calendar_year,
                    "semester": c.student.calendar.calendar_semester,
                    "course": c.student.calendar.course.course_name if c.student.calendar.course else "N/A"
                } if c.student.calendar else None,
                "proposal": {
                    "id": proposal.id_proposal,
                    "title": proposal.proposal_title,
                    "company": proposal.company.company_name if proposal.company else "ISEC",
                    "isec_advisor": proposal.isec_advisor.teacher_name if proposal.isec_advisor else "A designar",
                    "company_advisor": proposal.company_advisor.representative_name if proposal.company_advisor else "A designar"
                } if proposal else None,
                "protocol": protocol_data
            })
        
        return Response(data, status=HTTP_200_OK)
        
    except Exception as e:
        return Response({"message": "Erro ao listar colocações", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
def advanceCandidature(request, pk):
    """
    REQ-8-12: Advance candidature through workflow states.
    When advancing to 'placed', must include 'proposal_id' to accept.
    """
    auth_header = request.headers.get("Authorization")
    account, user_type, error = get_user_account(auth_header)
    
    if error:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)
    
    if user_type not in ["admin", "teacher"]:
        return Response({"message": "Não tem permissão para alterar estado de candidaturas"}, status=HTTP_403_FORBIDDEN)
    
    try:
        candidature = Candidature.objects.get(id_candidature=pk)
        
        new_state = request.data.get('state')
        notes = request.data.get('notes', '')
        proposal_id = request.data.get('proposal_id')  # Required when placing
        
        if not new_state:
            return Response({"message": "Novo estado é obrigatório"}, status=HTTP_400_BAD_REQUEST)
        
        # Validate state transition
        valid_states = [s[0] for s in Candidature.STATE_CHOICES]
        if new_state not in valid_states:
            return Response({"message": f"Estado inválido: {new_state}"}, status=HTTP_400_BAD_REQUEST)
        
        # When placing, must specify which proposal to accept
        if new_state == 'placed':
            if not proposal_id:
                # If no proposal_id provided, accept the first one
                first_cp = candidature.candidature_proposals.first()
                if first_cp:
                    proposal_id = first_cp.proposal.id_proposal
                else:
                    return Response({"message": "Nenhuma proposta encontrada para aceitar"}, status=HTTP_400_BAD_REQUEST)
        
        # State transition rules
        state_order = ['pending', 'submitted', 'revision', 'placed', 
                       'protocol_generated', 'presidency_signature', 
                       'company_signature', 'student_signature', 'finished']
        
        current_index = state_order.index(candidature.state) if candidature.state in state_order else -1
        new_index = state_order.index(new_state) if new_state in state_order else -1
        
        # Allow going backwards (rejection) or forward
        # But only admins can skip states
        if user_type != 'admin' and abs(new_index - current_index) > 1:
            return Response(
                {"message": "Não pode saltar estados no workflow"},
                status=HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            old_state = candidature.state
            candidature.state = new_state
            candidature.save()
            
            # When placing, mark the selected proposal as accepted
            if new_state == 'placed' and proposal_id:
                # Accept the selected proposal
                candidature.candidature_proposals.filter(
                    proposal__id_proposal=proposal_id
                ).update(state='accepted')
                
                # Reject all other proposals
                candidature.candidature_proposals.exclude(
                    proposal__id_proposal=proposal_id
                ).update(state='rejected')
            
            # Log history
            CandidatureHistory.objects.create(
                candidature=candidature,
                previous_state=old_state,
                new_state=new_state,
                changed_by=account,
                notes=notes or f"Estado alterado de {old_state} para {new_state}"
            )
        
        return Response({
            "message": "Estado atualizado com sucesso",
            "previous_state": old_state,
            "new_state": new_state
        }, status=HTTP_200_OK)
        
    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({"message": str(e)}, status=HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"message": "Erro ao atualizar candidatura", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def pendingActions(request):
    """
    REQ-8-12: Get list of pending actions requiring attention.
    """
    auth_header = request.headers.get("Authorization")
    account, user_type, error = get_user_account(auth_header)
    
    if error:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)
    
    if user_type not in ["admin", "teacher"]:
        return Response({"message": "Não tem permissão para ver ações pendentes"}, status=HTTP_403_FORBIDDEN)
    
    try:
        actions = []
        
        # Candidatures awaiting placement
        awaiting_placement = Candidature.objects.filter(state='submitted').count()
        if awaiting_placement > 0:
            actions.append({
                "type": "placement",
                "priority": "high",
                "title": "Candidaturas aguardando colocação",
                "count": awaiting_placement,
                "action_url": "/academic/placements?state=submitted",
                "description": f"{awaiting_placement} candidatura(s) submetida(s) aguardam colocação"
            })
        
        # Candidatures in revision
        in_revision = Candidature.objects.filter(state='revision').count()
        if in_revision > 0:
            actions.append({
                "type": "revision",
                "priority": "medium",
                "title": "Candidaturas em revisão",
                "count": in_revision,
                "action_url": "/academic/placements?state=revision",
                "description": f"{in_revision} candidatura(s) necessitam de revisão"
            })
        
        # Placed candidatures needing protocol generation
        needs_protocol = Candidature.objects.filter(state='placed').count()
        if needs_protocol > 0:
            actions.append({
                "type": "protocol_generation",
                "priority": "high",
                "title": "Protocolos por gerar",
                "count": needs_protocol,
                "action_url": "/academic/placements?state=placed",
                "description": f"{needs_protocol} candidatura(s) colocada(s) aguardam geração de protocolo"
            })
        
        # Protocols awaiting ISEC signature
        awaiting_isec = Candidature.objects.filter(state='protocol_generated').count()
        if awaiting_isec > 0:
            actions.append({
                "type": "isec_signature",
                "priority": "high",
                "title": "Assinaturas ISEC pendentes",
                "count": awaiting_isec,
                "action_url": "/academic/placements?state=protocol_generated",
                "description": f"{awaiting_isec} protocolo(s) aguardam assinatura do ISEC"
            })
        
        # Protocols awaiting company signature
        awaiting_company = Candidature.objects.filter(state='presidency_signature').count()
        if awaiting_company > 0:
            actions.append({
                "type": "company_signature",
                "priority": "medium",
                "title": "Assinaturas de empresa pendentes",
                "count": awaiting_company,
                "action_url": "/academic/placements?state=presidency_signature",
                "description": f"{awaiting_company} protocolo(s) aguardam assinatura da empresa"
            })
        
        # Protocols awaiting student signature
        awaiting_student = Candidature.objects.filter(state='company_signature').count()
        if awaiting_student > 0:
            actions.append({
                "type": "student_signature",
                "priority": "low",
                "title": "Assinaturas de estudante pendentes",
                "count": awaiting_student,
                "action_url": "/academic/placements?state=company_signature",
                "description": f"{awaiting_student} protocolo(s) aguardam assinatura do estudante"
            })
        
        # Proposals without ISEC advisor
        proposals_no_advisor = Proposal.objects.filter(isec_advisor__isnull=True).count()
        if proposals_no_advisor > 0:
            actions.append({
                "type": "advisor_assignment",
                "priority": "medium",
                "title": "Propostas sem orientador ISEC",
                "count": proposals_no_advisor,
                "action_url": "/proposal/list",
                "description": f"{proposals_no_advisor} proposta(s) sem orientador ISEC atribuído"
            })
        
        # Sort by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        actions.sort(key=lambda x: priority_order.get(x['priority'], 3))
        
        return Response({
            "total_actions": len(actions),
            "actions": actions
        }, status=HTTP_200_OK)
        
    except Exception as e:
        return Response({"message": "Erro ao obter ações pendentes", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def exportPlacements(request):
    """
    REQ-8-12: Export placements data (for academic services reports).
    """
    auth_header = request.headers.get("Authorization")
    account, user_type, error = get_user_account(auth_header)
    
    if error:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)
    
    if user_type not in ["admin", "teacher"]:
        return Response({"message": "Não tem permissão para exportar dados"}, status=HTTP_403_FORBIDDEN)
    
    try:
        from django.http import HttpResponse
        import csv
        from io import StringIO
        
        # Get filter params
        calendar_filter = request.query_params.get('calendar')
        state_filter = request.query_params.get('state')
        
        # Build queryset
        candidatures = Candidature.objects.select_related(
            'student__user', 'student__calendar__course'
        ).prefetch_related(
            'candidature_proposals__proposal__company',
            'candidature_proposals__proposal__isec_advisor',
            'candidature_proposals__proposal__company_advisor'
        ).filter(
            state__in=['placed', 'protocol_generated', 'presidency_signature', 
                      'company_signature', 'student_signature', 'finished']
        )
        
        if calendar_filter:
            candidatures = candidatures.filter(student__calendar__id_calendar=calendar_filter)
        if state_filter:
            candidatures = candidatures.filter(state=state_filter)
        
        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'Nº Aluno', 'Nome', 'Email', 'Curso', 'Ano/Semestre',
            'Proposta', 'Empresa', 'Orientador ISEC', 'Orientador Empresa',
            'Estado', 'Nº Protocolo', 'Data Submissão'
        ])
        
        for c in candidatures:
            accepted = c.candidature_proposals.filter(state='accepted').first()
            proposal = accepted.proposal if accepted else None
            protocol_num = c.protocol.protocol_number if hasattr(c, 'protocol') else ''
            
            writer.writerow([
                c.student.student_number,
                c.student.student_name,
                c.student.user.email,
                c.student.calendar.course.course_name if c.student.calendar and c.student.calendar.course else '',
                f"{c.student.calendar.calendar_year}/{c.student.calendar.calendar_semester}" if c.student.calendar else '',
                proposal.proposal_title if proposal else '',
                proposal.company.company_name if proposal and proposal.company else 'ISEC',
                proposal.isec_advisor.teacher_name if proposal and proposal.isec_advisor else '',
                proposal.company_advisor.representative_name if proposal and proposal.company_advisor else '',
                dict(Candidature.STATE_CHOICES).get(c.state, c.state),
                protocol_num,
                str(c.candidature_submission_date) if c.candidature_submission_date else ''
            ])
        
        output.seek(0)
        
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="colocacoes.csv"'
        return response
        
    except Exception as e:
        return Response({"message": "Erro ao exportar dados", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)

