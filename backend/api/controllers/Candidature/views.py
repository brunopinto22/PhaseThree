import traceback
from datetime import date

from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.status import *
from django.db import transaction

from api.models import *
from api.permissions import *
from api.token_manager import *


@api_view(["GET"])
def getCandidature(request, pk):
    """Get details of a specific candidature"""
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
        user_email == "Expired Token."
        or user_email == "Invalid Token"
        or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        candidature = Candidature.objects.get(id_candidature=pk)

        # Permission checks
        if user_type == "student":
            student = Student.objects.get(user__email=user_email)
            if candidature.student != student:
                return Response({"message": "Sem permissão para ver esta candidatura"}, status=HTTP_401_UNAUTHORIZED)
        
        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            candidature_module = Module.objects.get(module_name='Candidaturas')
            permission = Permissions.objects.get(teacher=teacher, module=candidature_module)
            if not permission.can_view:
                return Response({"message": "Sem permissão para ver candidaturas"}, status=HTTP_401_UNAUTHORIZED)

        elif user_type not in ["admin"]:
            return Response({"message": "Sem permissão para ver esta candidatura"}, status=HTTP_401_UNAUTHORIZED)

        # Get proposals with their states
        proposals = []
        for cp in candidature.candidature_proposals.all():
            proposals.append({
                "id": cp.proposal.id_proposal,
                "proposal_number": cp.proposal.calendar_proposal_number,
                "title": cp.proposal.proposal_title,
                "company": {
                    "id": cp.proposal.company.id_company if cp.proposal.company else None,
                    "name": cp.proposal.company.company_name if cp.proposal.company else "ISEC"
                },
                "state": cp.state,
            })

        data = {
            "id": candidature.id_candidature,
            "state": candidature.state,
            "submission_date": candidature.candidature_submission_date,
            "student": {
                "number": candidature.student.student_number,
                "name": candidature.student.student_name,
                "email": candidature.student.user.email,
                "pfp": request.build_absolute_uri(candidature.student.user.photo.url) if candidature.student.user.photo else None,
            },
            "proposals": proposals,
        }

        return JsonResponse(data, status=status.HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=status.HTTP_404_NOT_FOUND)
    except (Student.DoesNotExist, Teacher.DoesNotExist):
        return Response({"message": "Utilizador não encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({"error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def listCandidatures(request):
    """List all candidatures with optional filtering"""
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
        user_email == "Expired Token."
        or user_email == "Invalid Token"
        or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    try:
        # Permission checks
        if user_type == "student":
            student = Student.objects.get(user__email=user_email)
            candidatures = Candidature.objects.filter(student=student)
        
        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            candidature_module = Module.objects.get(module_name='Candidaturas')
            permission = Permissions.objects.get(teacher=teacher, module=candidature_module)
            if not permission.can_view:
                return Response({"message": "Sem permissão para ver candidaturas"}, status=HTTP_401_UNAUTHORIZED)
            candidatures = Candidature.objects.all()
        
        elif user_type == "admin":
            candidatures = Candidature.objects.all()
        
        else:
            return Response({"message": "Sem permissão para ver candidaturas"}, status=HTTP_401_UNAUTHORIZED)

        # Apply filters if provided
        state_filter = request.GET.get('state')
        if state_filter:
            candidatures = candidatures.filter(state=state_filter)

        calendar_filter = request.GET.get('calendar')
        if calendar_filter:
            candidatures = candidatures.filter(student__calendar__id_calendar=calendar_filter)

        if not candidatures.exists():
            return Response({"message": "Nenhuma candidatura encontrada"}, status=status.HTTP_204_NO_CONTENT)

        data = []
        for c in candidatures:
            # Get the accepted proposal if any
            accepted_proposal = c.candidature_proposals.filter(state="accepted").first()
            
            data.append({
                "id": c.id_candidature,
                "state": c.state,
                "submission_date": c.candidature_submission_date,
                "student": {
                    "number": c.student.student_number,
                    "name": c.student.student_name,
                },
                "proposal": {
                    "id": accepted_proposal.proposal.id_proposal if accepted_proposal else None,
                    "title": accepted_proposal.proposal.proposal_title if accepted_proposal else None,
                    "company": {
                        "id": accepted_proposal.proposal.company.id_company if accepted_proposal and accepted_proposal.proposal.company else None,
                        "name": accepted_proposal.proposal.company.company_name if accepted_proposal and accepted_proposal.proposal.company else "ISEC" if accepted_proposal else None,
                    } if accepted_proposal else None,
                } if accepted_proposal else None,
            })

        return Response(data, status=status.HTTP_200_OK)

    except (Student.DoesNotExist, Teacher.DoesNotExist):
        return Response({"message": "Utilizador não encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({"error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def createCandidature(request):
    """Create a new candidature with proposals"""
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
        user_email == "Expired Token."
        or user_email == "Invalid Token"
        or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type != "student":
        return Response({"message": "Apenas alunos podem criar candidaturas"}, status=HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(user__email=user_email)
        
        # Check if student already has a candidature
        if Candidature.objects.filter(student=student).exists():
            return Response({"message": "Já existe uma candidatura para este aluno"}, status=HTTP_400_BAD_REQUEST)

        # Validate calendar dates
        if not student.calendar:
            return Response({"message": "Aluno não tem calendário associado"}, status=HTTP_400_BAD_REQUEST)

        if student.calendar.candidatures < date.today():
            return Response({"message": "O período de candidaturas já terminou"}, status=HTTP_403_FORBIDDEN)

        # Get proposal IDs from request
        proposal_ids = request.data.get('proposals', [])
        if not proposal_ids:
            return Response({"message": "Deve selecionar pelo menos uma proposta"}, status=HTTP_400_BAD_REQUEST)

        # Validate number of proposals
        if len(proposal_ids) < student.calendar.min_proposals:
            return Response({"message": f"Deve selecionar pelo menos {student.calendar.min_proposals} propostas"}, status=HTTP_400_BAD_REQUEST)
        
        if len(proposal_ids) > student.calendar.max_proposals:
            return Response({"message": f"Deve selecionar no máximo {student.calendar.max_proposals} propostas"}, status=HTTP_400_BAD_REQUEST)

        # Create candidature
        with transaction.atomic():
            candidature = Candidature.objects.create(
                student=student,
                state='submitted',
                candidature_submission_date=date.today()
            )

            # Create candidature proposals
            for proposal_id in proposal_ids:
                try:
                    proposal = Proposal.objects.get(id_proposal=proposal_id)
                    
                    # Validate proposal belongs to same calendar
                    if proposal.calendar != student.calendar:
                        raise ValueError(f"Proposta {proposal_id} não pertence ao calendário do aluno")

                    CandidatureProposal.objects.create(
                        candidature=candidature,
                        proposal=proposal,
                        state='pending'
                    )
                except Proposal.DoesNotExist:
                    raise ValueError(f"Proposta {proposal_id} não encontrada")

        return Response({"message": "Candidatura criada com sucesso", "id": candidature.id_candidature}, status=status.HTTP_201_CREATED)

    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({"message": str(e)}, status=HTTP_400_BAD_REQUEST)
    except Exception as e:
        traceback.print_exc()
        return Response({"error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
def updateCandidatureState(request, pk):
    """Update the state of a candidature (admin/academic_services only)"""
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
        user_email == "Expired Token."
        or user_email == "Invalid Token"
        or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # Only admin and teachers with permission can update candidature state
    if user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        candidature_module = Module.objects.get(module_name='Candidaturas')
        permission = Permissions.objects.get(teacher=teacher, module=candidature_module)
        if not permission.can_edit:
            return Response({"message": "Sem permissão para editar candidaturas"}, status=HTTP_401_UNAUTHORIZED)
    elif user_type != "admin":
        return Response({"message": "Sem permissão para editar candidaturas"}, status=HTTP_401_UNAUTHORIZED)

    try:
        candidature = Candidature.objects.get(id_candidature=pk)
        new_state = request.data.get('state')

        if not new_state:
            return Response({"message": "Estado é obrigatório"}, status=HTTP_400_BAD_REQUEST)

        # Validate state value
        valid_states = [choice[0] for choice in Candidature.STATE_CHOICES]
        if new_state not in valid_states:
            return Response({"message": f"Estado inválido. Valores válidos: {', '.join(valid_states)}"}, status=HTTP_400_BAD_REQUEST)

        candidature.state = new_state
        candidature.save()

        return Response({"message": "Estado da candidatura atualizado com sucesso"}, status=status.HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=status.HTTP_404_NOT_FOUND)
    except (Teacher.DoesNotExist, Module.DoesNotExist, Permissions.DoesNotExist):
        return Response({"message": "Permissões não encontradas"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({"error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
def updateCandidatureProposalState(request, candidature_id, proposal_id):
    """Update the state of a specific proposal in a candidature (accept/reject)"""
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
        user_email == "Expired Token."
        or user_email == "Invalid Token"
        or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # Only admin and teachers with permission can update proposal states
    if user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        candidature_module = Module.objects.get(module_name='Candidaturas')
        permission = Permissions.objects.get(teacher=teacher, module=candidature_module)
        if not permission.can_edit:
            return Response({"message": "Sem permissão para editar candidaturas"}, status=HTTP_401_UNAUTHORIZED)
    elif user_type != "admin":
        return Response({"message": "Sem permissão para editar candidaturas"}, status=HTTP_401_UNAUTHORIZED)

    try:
        candidature = Candidature.objects.get(id_candidature=candidature_id)
        proposal = Proposal.objects.get(id_proposal=proposal_id)
        
        candidature_proposal = CandidatureProposal.objects.get(
            candidature=candidature,
            proposal=proposal
        )

        new_state = request.data.get('state')
        if not new_state:
            return Response({"message": "Estado é obrigatório"}, status=HTTP_400_BAD_REQUEST)

        # Validate state value
        valid_states = [choice[0] for choice in CandidatureProposal.STATE_CHOICES]
        if new_state not in valid_states:
            return Response({"message": f"Estado inválido. Valores válidos: {', '.join(valid_states)}"}, status=HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # If accepting a proposal, reject all others
            if new_state == 'accepted':
                # Reject all other proposals in this candidature
                CandidatureProposal.objects.filter(
                    candidature=candidature
                ).exclude(
                    proposal=proposal
                ).update(state='rejected')
                
                # Update candidature state to 'placed' when a proposal is accepted
                candidature.state = 'placed'
                candidature.save()

            candidature_proposal.state = new_state
            candidature_proposal.save()

        return Response({"message": "Estado da proposta atualizado com sucesso"}, status=status.HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=status.HTTP_404_NOT_FOUND)
    except Proposal.DoesNotExist:
        return Response({"message": "Proposta não encontrada"}, status=status.HTTP_404_NOT_FOUND)
    except CandidatureProposal.DoesNotExist:
        return Response({"message": "Proposta não está associada a esta candidatura"}, status=status.HTTP_404_NOT_FOUND)
    except (Teacher.DoesNotExist, Module.DoesNotExist, Permissions.DoesNotExist):
        return Response({"message": "Permissões não encontradas"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({"error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
