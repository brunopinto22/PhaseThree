from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.status import *
from django.db import transaction
from datetime import date

from api.models import *
from api.permissions import *
from api.token_manager import *


@api_view(['POST'])
def submitCandidature(request):
    """
    Endpoint para aluno submeter candidatura com lista de propostas.
    Valida limites min/max, período ativo, e pertença ao calendário.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    # 1. Autenticação
    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # 2. Verificar se é student
    if user_type != "student":
        return Response({"message": "Sem permissão para criar candidatura"}, status=HTTP_401_UNAUTHORIZED)

    try:
        # 3. Obter student
        student = Student.objects.get(user__email=user_email)

        # 4. Validar que student tem calendar
        if not student.calendar:
            return Response(
                {"message": "Aluno não está associado a um calendário"},
                status=HTTP_400_BAD_REQUEST
            )

        calendar = student.calendar

        # 5. Validar período de candidaturas ativo
        today = date.today()
        if today > calendar.candidatures:
            return Response(
                {"message": "Período de candidaturas não está ativo"},
                status=HTTP_400_BAD_REQUEST
            )

        # 6. Validar que NÃO tem candidatura existente
        if Candidature.objects.filter(student=student).exists():
            return Response(
                {"message": "Já existe uma candidatura submetida"},
                status=HTTP_400_BAD_REQUEST
            )

        # 7. Receber lista de proposal_ids
        proposal_ids = request.data.get("proposal_ids", [])

        if not isinstance(proposal_ids, list):
            return Response(
                {"message": "proposal_ids deve ser uma lista"},
                status=HTTP_400_BAD_REQUEST
            )

        # 8. Validar quantidade de propostas (min/max)
        num_proposals = len(proposal_ids)
        if num_proposals < calendar.min_proposals or num_proposals > calendar.max_proposals:
            return Response(
                {"message": f"Deve selecionar entre {calendar.min_proposals} e {calendar.max_proposals} propostas"},
                status=HTTP_400_BAD_REQUEST
            )

        # 9. Validar que não há duplicados
        if len(proposal_ids) != len(set(proposal_ids)):
            return Response(
                {"message": "Não pode selecionar a mesma proposta mais de uma vez"},
                status=HTTP_400_BAD_REQUEST
            )

        # 10. Validar que todas propostas existem e pertencem ao calendário do aluno
        proposals = []
        for prop_id in proposal_ids:
            try:
                proposal = Proposal.objects.get(id_proposal=prop_id)
                
                # Verificar se proposta pertence ao calendário do aluno
                if proposal.calendar.id_calendar != calendar.id_calendar:
                    return Response(
                        {"message": f"Proposta {prop_id} não pertence ao calendário do aluno"},
                        status=HTTP_400_BAD_REQUEST
                    )
                
                proposals.append(proposal)
            except Proposal.DoesNotExist:
                return Response(
                    {"message": f"Proposta {prop_id} não encontrada"},
                    status=HTTP_404_NOT_FOUND
                )

        # 11. Criar Candidature e CandidatureProposals
        with transaction.atomic():
            candidature = Candidature.objects.create(
                student=student,
                state='submitted',
                candidature_submission_date=today
            )

            # Registrar histórico inicial
            CandidatureStatusHistory.objects.create(
                candidature=candidature,
                old_state=None,
                new_state='submitted',
                changed_by=student.user,
                notes='Candidatura inicial submetida'
            )

            for proposal in proposals:
                CandidatureProposal.objects.create(
                    candidature=candidature,
                    proposal=proposal,
                    state='pending'
                )

        return Response(
            {
                "message": "Candidatura submetida com sucesso",
                "id_candidature": candidature.id_candidature
            },
            status=HTTP_201_CREATED
        )

    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
def updateCandidature(request, pk):
    """
    Endpoint para aluno editar candidatura existente.
    Apenas candidaturas no estado 'submitted' podem ser editadas.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    # 1. Autenticação
    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # 2. Verificar se é student
    if user_type != "student":
        return Response({"message": "Sem permissão para editar candidatura"}, status=HTTP_401_UNAUTHORIZED)

    try:
        # 3. Obter candidatura
        candidature = Candidature.objects.get(id_candidature=pk)

        # 4. Obter student
        student = Student.objects.get(user__email=user_email)

        # 5. Validar que candidatura pertence ao student
        if candidature.student.student_number != student.student_number:
            return Response(
                {"message": "Sem permissão para editar esta candidatura"},
                status=HTTP_401_UNAUTHORIZED
            )

        # 6. Validar estado (apenas 'submitted' pode ser editado)
        if candidature.state != 'submitted':
            return Response(
                {"message": f"Candidatura não pode ser editada (estado: {candidature.state})"},
                status=HTTP_400_BAD_REQUEST
            )

        # 7. Validar período de candidaturas ativo
        calendar = student.calendar
        today = date.today()
        if today > calendar.candidatures:
            return Response(
                {"message": "Período de candidaturas não está ativo"},
                status=HTTP_400_BAD_REQUEST
            )

        # 8. Receber nova lista de proposal_ids
        proposal_ids = request.data.get("proposal_ids", [])

        if not isinstance(proposal_ids, list):
            return Response(
                {"message": "proposal_ids deve ser uma lista"},
                status=HTTP_400_BAD_REQUEST
            )

        # 9. Validar quantidade de propostas (min/max)
        num_proposals = len(proposal_ids)
        if num_proposals < calendar.min_proposals or num_proposals > calendar.max_proposals:
            return Response(
                {"message": f"Deve selecionar entre {calendar.min_proposals} e {calendar.max_proposals} propostas"},
                status=HTTP_400_BAD_REQUEST
            )

        # 10. Validar que não há duplicados
        if len(proposal_ids) != len(set(proposal_ids)):
            return Response(
                {"message": "Não pode selecionar a mesma proposta mais de uma vez"},
                status=HTTP_400_BAD_REQUEST
            )

        # 11. Validar que todas propostas existem e pertencem ao calendário do aluno
        proposals = []
        for prop_id in proposal_ids:
            try:
                proposal = Proposal.objects.get(id_proposal=prop_id)
                
                # Verificar se proposta pertence ao calendário do aluno
                if proposal.calendar.id_calendar != calendar.id_calendar:
                    return Response(
                        {"message": f"Proposta {prop_id} não pertence ao calendário do aluno"},
                        status=HTTP_400_BAD_REQUEST
                    )
                
                proposals.append(proposal)
            except Proposal.DoesNotExist:
                return Response(
                    {"message": f"Proposta {prop_id} não encontrada"},
                    status=HTTP_404_NOT_FOUND
                )

        # 12. Atualizar candidatura
        with transaction.atomic():
            # Deletar CandidatureProposals antigos
            CandidatureProposal.objects.filter(candidature=candidature).delete()

            # Criar novos CandidatureProposals
            for proposal in proposals:
                CandidatureProposal.objects.create(
                    candidature=candidature,
                    proposal=proposal,
                    state='pending'
                )

        return Response(
            {"message": "Candidatura atualizada com sucesso"},
            status=HTTP_200_OK
        )

    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def getMyCandidature(request):
    """
    Endpoint para aluno obter sua própria candidatura.
    Retorna dados da candidatura e limites do calendário.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    # 1. Autenticação
    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # 2. Verificar se é student
    if user_type != "student":
        return Response({"message": "Sem permissão para ver candidatura"}, status=HTTP_401_UNAUTHORIZED)

    try:
        # 3. Obter student
        student = Student.objects.get(user__email=user_email)

        # 4. Obter calendar do student
        calendar = student.calendar
        if not calendar:
            return Response(
                {"message": "Aluno não está associado a um calendário"},
                status=HTTP_400_BAD_REQUEST
            )

        # 5. Buscar candidatura do student
        try:
            candidature = Candidature.objects.get(student=student)

            # Obter propostas da candidatura
            candidature_proposals = CandidatureProposal.objects.filter(
                candidature=candidature
            ).select_related('proposal', 'proposal__company')

            proposals_list = []
            for cp in candidature_proposals:
                proposals_list.append({
                    "id": cp.proposal.id_proposal,
                    "title": cp.proposal.proposal_title,
                    "company": {
                        "id": cp.proposal.company.id_company if cp.proposal.company else None,
                        "name": cp.proposal.company.company_name if cp.proposal.company else "ISEC"
                    },
                    "state": cp.state
                })

            # Candidatura existe
            return Response({
                "has_candidature": True,
                "id_candidature": candidature.id_candidature,
                "state": candidature.state,
                "submission_date": candidature.candidature_submission_date.strftime("%d/%m/%Y"),
                "created_at": candidature.created_at.strftime("%d/%m/%Y %H:%M"),
                "last_updated": candidature.last_updated.strftime("%d/%m/%Y %H:%M"),
                "proposals": proposals_list,
                "calendar": {
                    "min": calendar.min_proposals,
                    "max": calendar.max_proposals,
                    "candidatures_deadline": calendar.candidatures.strftime("%d/%m/%Y")
                }
            }, status=HTTP_200_OK)

        except Candidature.DoesNotExist:
            # Não tem candidatura
            return Response({
                "has_candidature": False,
                "calendar": {
                    "min": calendar.min_proposals,
                    "max": calendar.max_proposals,
                    "candidatures_deadline": calendar.candidatures.strftime("%d/%m/%Y")
                }
            }, status=HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def getCandidatureHistory(request, pk):
    """
    Endpoint para obter histórico de mudanças de estado de uma candidatura.
    Apenas o próprio aluno ou admin/academic_services podem acessar.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    # Autenticação
    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        candidature = Candidature.objects.get(id_candidature=pk)
        
        # Verificar permissões
        if user_type == "student":
            student = Student.objects.get(user__email=user_email)
            if candidature.student != student:
                return Response(
                    {"message": "Sem permissão para ver este histórico"},
                    status=HTTP_401_UNAUTHORIZED
                )
        elif user_type not in ["admin", "academic_services"]:
            return Response(
                {"message": "Sem permissão para ver histórico"},
                status=HTTP_401_UNAUTHORIZED
            )
        
        # Buscar histórico
        history = CandidatureStatusHistory.objects.filter(
            candidature=candidature
        ).select_related('changed_by').order_by('-changed_at')
        
        history_list = []
        for entry in history:
            changed_by_info = {
                "email": "Sistema",
                "type": "system"
            }
            if entry.changed_by:
                changed_by_info = {
                    "email": entry.changed_by.email,
                    "type": entry.changed_by.user_type
                }
            
            history_list.append({
                "id": entry.id_history,
                "old_state": entry.old_state,
                "new_state": entry.new_state,
                "changed_at": entry.changed_at.strftime("%d/%m/%Y %H:%M:%S"),
                "changed_by": changed_by_info,
                "notes": entry.notes
            })
        
        return Response({
            "candidature_id": candidature.id_candidature,
            "current_state": candidature.state,
            "history": history_list
        }, status=HTTP_200_OK)
        
    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
def deleteCandidature(request):
    """
    Endpoint para aluno deletar sua própria candidatura.
    Deleta a candidatura e todos os registros relacionados (cascade).
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    # 1. Autenticação
    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # 2. Verificar se é student
    if user_type != "student":
        return Response({"message": "Sem permissão para deletar candidatura"}, status=HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(user__email=user_email)
    except Student.DoesNotExist:
        return Response({"message": "Estudante não encontrado"}, status=HTTP_404_NOT_FOUND)

    # 3. Buscar candidatura do estudante
    try:
        candidature = Candidature.objects.get(student=student)
    except Candidature.DoesNotExist:
        return Response({"message": "Você não possui candidatura para deletar"}, status=HTTP_404_NOT_FOUND)

    # 4. Deletar candidatura (cascade vai deletar propostas e histórico relacionados)
    candidature_id = candidature.id_candidature
    candidature.delete()

    return Response({
        "message": "Candidatura deletada com sucesso",
        "deleted_candidature_id": candidature_id
    }, status=HTTP_200_OK)
