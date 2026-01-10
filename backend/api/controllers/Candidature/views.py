from datetime import date
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.status import *
from django.db import transaction

from api.models import (
    Student, Proposal, Candidature, CandidatureProposal,
    Calendar, Teacher, Module, Permissions, CandidatureHistory, Accounts
)
from api.token_manager import decode_token


def log_candidature_history(candidature, previous_state, new_state, user_email=None, notes=None):
    """Helper to log candidature state changes (REQ-3)"""
    changed_by = None
    if user_email:
        changed_by = Accounts.objects.filter(email=user_email).first()
    
    CandidatureHistory.objects.create(
        candidature=candidature,
        previous_state=previous_state,
        new_state=new_state,
        changed_by=changed_by,
        notes=notes
    )


@api_view(["POST"])
def submitCandidature(request):
    """
    Submit a new candidature with a list of proposals.
    REQ-1: Validates that proposals count is within calendar's min/max range.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    if user_type != "student":
        return Response({"message": "Apenas alunos podem submeter candidaturas"}, status=HTTP_403_FORBIDDEN)

    try:
        student = Student.objects.get(user__email=user_email)
        calendar = student.calendar

        if not calendar:
            return Response({"message": "Não tem um calendário atribuído"}, status=HTTP_400_BAD_REQUEST)

        # Check if candidature period is active
        today = date.today()
        if not (calendar.divulgation <= today <= calendar.candidatures):
            return Response({
                "message": "Fora do período de candidaturas",
                "start": calendar.divulgation.strftime("%d/%m/%Y"),
                "end": calendar.candidatures.strftime("%d/%m/%Y")
            }, status=HTTP_400_BAD_REQUEST)

        # Check if student already has a candidature for this calendar
        existing = Candidature.objects.filter(student=student, student__calendar=calendar).first()
        if existing:
            return Response({
                "message": "Já submeteu uma candidatura para este calendário",
                "candidature_id": existing.id_candidature
            }, status=HTTP_400_BAD_REQUEST)

        # Check if student has missing info
        if student.is_missing_info():
            return Response({"message": "Complete o seu perfil antes de submeter uma candidatura"}, status=HTTP_400_BAD_REQUEST)

        # Get and validate proposals
        proposal_ids = request.data.get("proposals", [])
        if not isinstance(proposal_ids, list):
            return Response({"message": "O campo 'proposals' deve ser uma lista de IDs"}, status=HTTP_400_BAD_REQUEST)

        # REQ-1: Validate proposal count within range
        min_proposals = calendar.min_proposals
        max_proposals = calendar.max_proposals
        count = len(proposal_ids)

        if count < min_proposals:
            return Response({
                "message": f"Deve selecionar pelo menos {min_proposals} proposta(s)",
                "min": min_proposals,
                "max": max_proposals,
                "selected": count
            }, status=HTTP_400_BAD_REQUEST)

        if count > max_proposals:
            return Response({
                "message": f"Não pode selecionar mais de {max_proposals} proposta(s)",
                "min": min_proposals,
                "max": max_proposals,
                "selected": count
            }, status=HTTP_400_BAD_REQUEST)

        # Validate all proposals exist and belong to student's calendar
        proposals = Proposal.objects.filter(id_proposal__in=proposal_ids)
        if proposals.count() != count:
            return Response({"message": "Uma ou mais propostas não foram encontradas"}, status=HTTP_404_NOT_FOUND)

        for p in proposals:
            if p.calendar != calendar:
                return Response({
                    "message": f"A proposta '{p.proposal_title}' não pertence ao seu calendário"
                }, status=HTTP_400_BAD_REQUEST)
            if p.get_slots_left() <= 0:
                return Response({
                    "message": f"A proposta '{p.proposal_title}' não tem vagas disponíveis"
                }, status=HTTP_400_BAD_REQUEST)

        # Check for duplicates
        if len(set(proposal_ids)) != count:
            return Response({"message": "Não pode selecionar a mesma proposta mais de uma vez"}, status=HTTP_400_BAD_REQUEST)

        # Create candidature with proposals
        with transaction.atomic():
            candidature = Candidature.objects.create(
                student=student,
                state='submitted',
                candidature_submission_date=today
            )

            for idx, proposal_id in enumerate(proposal_ids):
                proposal = proposals.get(id_proposal=proposal_id)
                CandidatureProposal.objects.create(
                    candidature=candidature,
                    proposal=proposal,
                    state='pending'
                )

            # REQ-3: Log initial state
            log_candidature_history(
                candidature=candidature,
                previous_state=None,
                new_state='submitted',
                user_email=user_email,
                notes='Candidatura submetida pelo aluno'
            )

        return Response({
            "message": "Candidatura submetida com sucesso",
            "candidature_id": candidature.id_candidature,
            "proposals_count": count
        }, status=HTTP_201_CREATED)

    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def getCandidature(request, pk):
    """Get a specific candidature by ID."""
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    try:
        candidature = Candidature.objects.get(id_candidature=pk)

        # Check permissions
        if user_type == "student":
            student = Student.objects.get(user__email=user_email)
            if candidature.student != student:
                return Response({"message": "Não tem permissão para ver esta candidatura"}, status=HTTP_403_FORBIDDEN)

        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            module = Module.objects.get(module_name='Candidaturas')
            permission = Permissions.objects.filter(teacher=teacher, module=module).first()
            if not permission or not permission.can_view:
                # Check if teacher is in commission for student's course
                if not candidature.student.student_course.commission.filter(id_teacher=teacher.id_teacher).exists():
                    return Response({"message": "Não tem permissão para ver esta candidatura"}, status=HTTP_403_FORBIDDEN)

        elif user_type not in ["admin"]:
            return Response({"message": "Não tem permissão para ver candidaturas"}, status=HTTP_403_FORBIDDEN)

        # Build response
        calendar = candidature.student.calendar
        can_edit = calendar and calendar.divulgation <= date.today() <= calendar.candidatures

        proposals_data = []
        for cp in candidature.candidature_proposals.all():
            proposals_data.append({
                "id": cp.proposal.id_proposal,
                "proposal_number": cp.proposal.calendar_proposal_number,
                "title": cp.proposal.proposal_title,
                "company": {
                    "id": cp.proposal.company.id_company if cp.proposal.company else None,
                    "name": cp.proposal.company.company_name if cp.proposal.company else "ISEC"
                },
                "state": cp.state,
                "slots": cp.proposal.slots,
                "taken": cp.proposal.students.count()
            })

        # REQ-3: Include history
        history_data = []
        for h in candidature.history.all():
            history_data.append({
                "previous_state": h.previous_state,
                "new_state": h.new_state,
                "changed_by": h.changed_by.email if h.changed_by else "Sistema",
                "changed_at": h.changed_at.strftime("%d/%m/%Y %H:%M"),
                "notes": h.notes
            })

        # Check if protocol exists
        protocol_id = None
        if hasattr(candidature, 'protocol'):
            protocol_id = candidature.protocol.id_protocol

        data = {
            "id": candidature.id_candidature,
            "state": candidature.state,
            "submission_date": candidature.candidature_submission_date.strftime("%d/%m/%Y"),
            "can_edit": can_edit and candidature.state == 'submitted',
            "protocol_id": protocol_id,
            "student": {
                "number": candidature.student.student_number,
                "name": candidature.student.student_name,
                "email": candidature.student.user.email,
                "course": {
                    "id": candidature.student.student_course.id_course,
                    "name": candidature.student.student_course.course_name
                }
            },
            "calendar": {
                "id": calendar.id_calendar if calendar else None,
                "title": str(calendar) if calendar else None,
                "min_proposals": calendar.min_proposals if calendar else 0,
                "max_proposals": calendar.max_proposals if calendar else 0
            },
            "proposals": proposals_data,
            "history": history_data
        }

        return Response(data, status=HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def getStudentCandidature(request):
    """Get the logged-in student's candidature for their current calendar."""
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    if user_type != "student":
        return Response({"message": "Apenas alunos podem aceder a esta funcionalidade"}, status=HTTP_403_FORBIDDEN)

    try:
        try:
            student = Student.objects.get(user__email=user_email)
        except Student.DoesNotExist:
            return Response({"message": "Registo de aluno não encontrado. Por favor, faça logout e login novamente."}, status=HTTP_404_NOT_FOUND)
        
        calendar = student.calendar

        if not calendar:
            return Response({
                "candidature": None,
                "can_submit": False,
                "calendar": None,
                "message": "Não tem um calendário atribuído"
            }, status=HTTP_200_OK)

        candidature = Candidature.objects.filter(student=student).first()

        if not candidature:
            # Return info about limits even if no candidature exists
            today = date.today()
            return Response({
                "candidature": None,
                "can_submit": calendar.divulgation <= today <= calendar.candidatures,
                "calendar": {
                    "id": calendar.id_calendar,
                    "title": str(calendar),
                    "min_proposals": calendar.min_proposals,
                    "max_proposals": calendar.max_proposals,
                    "candidatures_start": calendar.divulgation.strftime("%d/%m/%Y"),
                    "candidatures_end": calendar.candidatures.strftime("%d/%m/%Y")
                }
            }, status=HTTP_200_OK)

        # Build candidature data
        can_edit = calendar.divulgation <= date.today() <= calendar.candidatures

        proposals_data = []
        for cp in candidature.candidature_proposals.all():
            proposals_data.append({
                "id": cp.proposal.id_proposal,
                "proposal_number": cp.proposal.calendar_proposal_number,
                "title": cp.proposal.proposal_title,
                "company": {
                    "id": cp.proposal.company.id_company if cp.proposal.company else None,
                    "name": cp.proposal.company.company_name if cp.proposal.company else "ISEC"
                },
                "state": cp.state,
                "slots": cp.proposal.slots,
                "taken": cp.proposal.students.count()
            })

        # REQ-3: Include history
        history_data = []
        for h in candidature.history.all():
            history_data.append({
                "previous_state": h.previous_state,
                "new_state": h.new_state,
                "changed_by": h.changed_by.email if h.changed_by else "Sistema",
                "changed_at": h.changed_at.strftime("%d/%m/%Y %H:%M"),
                "notes": h.notes
            })

        data = {
            "candidature": {
                "id": candidature.id_candidature,
                "state": candidature.state,
                "submission_date": candidature.candidature_submission_date.strftime("%d/%m/%Y"),
                "can_edit": can_edit and candidature.state == 'submitted',
                "proposals": proposals_data,
                "history": history_data
            },
            "calendar": {
                "id": calendar.id_calendar,
                "title": str(calendar),
                "min_proposals": calendar.min_proposals,
                "max_proposals": calendar.max_proposals,
                "candidatures_start": calendar.divulgation.strftime("%d/%m/%Y"),
                "candidatures_end": calendar.candidatures.strftime("%d/%m/%Y")
            }
        }

        return Response(data, status=HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
def updateCandidature(request, pk):
    """
    Update a candidature's proposals.
    REQ-1: Validates that proposals count is within calendar's min/max range.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    try:
        candidature = Candidature.objects.get(id_candidature=pk)
        calendar = candidature.student.calendar

        # Check permissions
        if user_type == "student":
            student = Student.objects.get(user__email=user_email)
            if candidature.student != student:
                return Response({"message": "Não tem permissão para editar esta candidatura"}, status=HTTP_403_FORBIDDEN)
            # Students can only edit if state is 'submitted' and within candidature period
            if candidature.state != 'submitted':
                return Response({"message": "Não pode editar uma candidatura que já foi processada"}, status=HTTP_403_FORBIDDEN)

        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            module = Module.objects.get(module_name='Candidaturas')
            permission = Permissions.objects.filter(teacher=teacher, module=module).first()
            if not permission or not permission.can_edit:
                return Response({"message": "Não tem permissão para editar candidaturas"}, status=HTTP_403_FORBIDDEN)

        elif user_type != "admin":
            return Response({"message": "Não tem permissão para editar candidaturas"}, status=HTTP_403_FORBIDDEN)

        # Check if candidature period is active (for students)
        if user_type == "student":
            today = date.today()
            if not (calendar.divulgation <= today <= calendar.candidatures):
                return Response({
                    "message": "Fora do período de candidaturas",
                    "start": calendar.divulgation.strftime("%d/%m/%Y"),
                    "end": calendar.candidatures.strftime("%d/%m/%Y")
                }, status=HTTP_400_BAD_REQUEST)

        # Get and validate proposals
        proposal_ids = request.data.get("proposals", [])
        if not isinstance(proposal_ids, list):
            return Response({"message": "O campo 'proposals' deve ser uma lista de IDs"}, status=HTTP_400_BAD_REQUEST)

        # REQ-1: Validate proposal count within range
        min_proposals = calendar.min_proposals
        max_proposals = calendar.max_proposals
        count = len(proposal_ids)

        if count < min_proposals:
            return Response({
                "message": f"Deve selecionar pelo menos {min_proposals} proposta(s)",
                "min": min_proposals,
                "max": max_proposals,
                "selected": count
            }, status=HTTP_400_BAD_REQUEST)

        if count > max_proposals:
            return Response({
                "message": f"Não pode selecionar mais de {max_proposals} proposta(s)",
                "min": min_proposals,
                "max": max_proposals,
                "selected": count
            }, status=HTTP_400_BAD_REQUEST)

        # Validate all proposals exist and belong to student's calendar
        proposals = Proposal.objects.filter(id_proposal__in=proposal_ids)
        if proposals.count() != count:
            return Response({"message": "Uma ou mais propostas não foram encontradas"}, status=HTTP_404_NOT_FOUND)

        for p in proposals:
            if p.calendar != calendar:
                return Response({
                    "message": f"A proposta '{p.proposal_title}' não pertence ao calendário"
                }, status=HTTP_400_BAD_REQUEST)

        # Check for duplicates
        if len(set(proposal_ids)) != count:
            return Response({"message": "Não pode selecionar a mesma proposta mais de uma vez"}, status=HTTP_400_BAD_REQUEST)

        # Update candidature proposals
        with transaction.atomic():
            # Remove existing proposals
            CandidatureProposal.objects.filter(candidature=candidature).delete()

            # Add new proposals
            for proposal_id in proposal_ids:
                proposal = proposals.get(id_proposal=proposal_id)
                CandidatureProposal.objects.create(
                    candidature=candidature,
                    proposal=proposal,
                    state='pending'
                )

        return Response({
            "message": "Candidatura atualizada com sucesso",
            "proposals_count": count
        }, status=HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def listCandidatures(request):
    """List all candidatures (for admin/teachers with permission)."""
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    try:
        candidatures = Candidature.objects.all()
        can_edit = False
        can_delete = False

        if user_type == "admin":
            can_edit = can_delete = True

        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            module = Module.objects.get(module_name='Candidaturas')
            permission = Permissions.objects.filter(teacher=teacher, module=module).first()

            if permission and permission.can_view:
                can_edit = permission.can_edit
                can_delete = permission.can_delete
            else:
                # Filter to only courses where teacher is in commission
                courses = teacher.course_commission.all()
                candidatures = candidatures.filter(student__student_course__in=courses)

        elif user_type == "student":
            return Response({"message": "Alunos devem usar /candidature/me"}, status=HTTP_403_FORBIDDEN)

        else:
            return Response({"message": "Não tem permissão para ver candidaturas"}, status=HTTP_403_FORBIDDEN)

        # Optional calendar filter
        calendar_id = request.query_params.get("calendar")
        if calendar_id:
            candidatures = candidatures.filter(student__calendar__id_calendar=calendar_id)

        data = []
        for c in candidatures:
            accepted_proposal = c.candidature_proposals.filter(state='accepted').first()
            data.append({
                "id": c.id_candidature,
                "state": c.state,
                "submission_date": c.candidature_submission_date.strftime("%d/%m/%Y"),
                "student": {
                    "number": c.student.student_number,
                    "name": c.student.student_name,
                    "email": c.student.user.email
                },
                "proposals_count": c.candidature_proposals.count(),
                "accepted_proposal": {
                    "id": accepted_proposal.proposal.id_proposal,
                    "title": accepted_proposal.proposal.proposal_title,
                    "company": accepted_proposal.proposal.company.company_name if accepted_proposal.proposal.company else "ISEC"
                } if accepted_proposal else None,
                "can_edit": can_edit,
                "can_delete": can_delete
            })

        if not data:
            return Response({"message": "Nenhuma candidatura encontrada"}, status=HTTP_204_NO_CONTENT)

        return Response(data, status=HTTP_200_OK)

    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
def deleteCandidature(request, pk):
    """Delete a candidature (admin/teachers only, or student if within period)."""
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    try:
        candidature = Candidature.objects.get(id_candidature=pk)

        if user_type == "student":
            student = Student.objects.get(user__email=user_email)
            if candidature.student != student:
                return Response({"message": "Não tem permissão para eliminar esta candidatura"}, status=HTTP_403_FORBIDDEN)
            if candidature.state != 'submitted':
                return Response({"message": "Não pode eliminar uma candidatura que já foi processada"}, status=HTTP_403_FORBIDDEN)
            calendar = student.calendar
            if not (calendar.divulgation <= date.today() <= calendar.candidatures):
                return Response({"message": "Fora do período de candidaturas"}, status=HTTP_403_FORBIDDEN)

        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            module = Module.objects.get(module_name='Candidaturas')
            permission = Permissions.objects.filter(teacher=teacher, module=module).first()
            if not permission or not permission.can_delete:
                return Response({"message": "Não tem permissão para eliminar candidaturas"}, status=HTTP_403_FORBIDDEN)

        elif user_type != "admin":
            return Response({"message": "Não tem permissão para eliminar candidaturas"}, status=HTTP_403_FORBIDDEN)

        candidature.delete()
        return Response({"message": "Candidatura eliminada com sucesso"}, status=HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
def changeCandidatureState(request, pk):
    """
    Change a candidature's state (admin/teachers only).
    REQ-3: Logs state change with timestamp.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    if user_type not in ["admin", "teacher"]:
        return Response({"message": "Não tem permissão para alterar o estado de candidaturas"}, status=HTTP_403_FORBIDDEN)

    try:
        candidature = Candidature.objects.get(id_candidature=pk)

        if user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            module = Module.objects.get(module_name='Candidaturas')
            permission = Permissions.objects.filter(teacher=teacher, module=module).first()
            if not permission or not permission.can_edit:
                return Response({"message": "Não tem permissão para alterar candidaturas"}, status=HTTP_403_FORBIDDEN)

        new_state = request.data.get("state")
        notes = request.data.get("notes", "")

        valid_states = [s[0] for s in Candidature.STATE_CHOICES]
        if new_state not in valid_states:
            return Response({
                "message": f"Estado inválido. Estados válidos: {', '.join(valid_states)}"
            }, status=HTTP_400_BAD_REQUEST)

        previous_state = candidature.state
        if previous_state == new_state:
            return Response({"message": "A candidatura já está neste estado"}, status=HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            candidature.state = new_state
            candidature.save()

            # REQ-3: Log state change
            log_candidature_history(
                candidature=candidature,
                previous_state=previous_state,
                new_state=new_state,
                user_email=user_email,
                notes=notes or f"Estado alterado de '{previous_state}' para '{new_state}'"
            )

        return Response({
            "message": "Estado da candidatura alterado com sucesso",
            "previous_state": previous_state,
            "new_state": new_state
        }, status=HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)

