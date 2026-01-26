from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.status import *
from django.db import transaction
from datetime import date
from django.utils import timezone

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

    # 2. Lógica de deleção
    try:
        if user_type == "student":
            # Estudante deleta a SUA própria candidatura
            try:
                student = Student.objects.get(user__email=user_email)
                candidature = Candidature.objects.get(student=student)
            except Student.DoesNotExist:
                return Response({"message": "Estudante não encontrado"}, status=HTTP_404_NOT_FOUND)
            except Candidature.DoesNotExist:
                return Response({"message": "Você não possui candidatura para deletar"}, status=HTTP_404_NOT_FOUND)
        
        elif user_type in ["admin", "academic_services"]:
            # Admin/Academic deleta POR ID
            candidature_id = request.data.get("id")
            if not candidature_id:
                return Response({"message": "ID da candidatura é obrigatório"}, status=HTTP_400_BAD_REQUEST)
            
            try:
                candidature = Candidature.objects.get(id_candidature=candidature_id)
            except Candidature.DoesNotExist:
                return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
        
        else:
            return Response({"message": "Sem permissão para deletar candidatura"}, status=HTTP_403_FORBIDDEN)

        # Deletar candidatura
        candidature.delete()
        return Response({"message": "Candidatura deletada com sucesso"}, status=HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def listAllCandidatures(request):
    """
    Endpoint para listar todas as candidaturas.
    Apenas admin e academic_services têm permissão.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    # 1. Autenticação
    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # 2. Verificar permissões (apenas admin e academic_services)
    if user_type not in ["admin", "academic_services"]:
        return Response(
            {"message": "Sem permissão para ver lista de candidaturas"},
            status=HTTP_403_FORBIDDEN
        )

    try:
        # 3. Obter todas as candidaturas
        candidatures = Candidature.objects.all().select_related(
            'student', 
            'student__user',
            'student__student_course'
        ).prefetch_related('candidature_proposals__proposal__company')

        candidatures_list = []
        for candidature in candidatures:
            # Obter a proposta principal (aceite ou primeira da lista)
            candidature_proposals = candidature.candidature_proposals.all()
            
            # Tentar encontrar proposta aceite primeiro
            main_proposal = None
            for cp in candidature_proposals:
                if cp.state == 'accepted':
                    main_proposal = cp.proposal
                    break
            
            # Se não há proposta aceite, usar a primeira
            if not main_proposal and candidature_proposals:
                main_proposal = candidature_proposals[0].proposal

            # Determinar nome da empresa/docente
            company_name = None
            proposal_name = None
            if main_proposal:
                proposal_name = main_proposal.proposal_title
                if main_proposal.company:
                    company_name = main_proposal.company.company_name
                elif main_proposal.isec_advisor:
                    company_name = main_proposal.isec_advisor.teacher_name
                else:
                    company_name = "ISEC"

            candidatures_list.append({
                "id": candidature.id_candidature,
                "studentNumber": candidature.student.student_number,
                "studentName": candidature.student.student_name,
                "companyName": company_name,
                "proposalName": proposal_name,
                "state": candidature.state,
                "submissionDate": candidature.candidature_submission_date.strftime("%d/%m/%Y")
            })

        return Response(candidatures_list, status=HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def getCandidatureById(request, pk):
    """
    Endpoint para obter detalhes de uma candidatura específica por ID.
    Estudantes podem ver apenas sua própria candidatura.
    Admin e academic_services podem ver qualquer candidatura.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    # 1. Autenticação
    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        # 2. Obter candidatura
        candidature = Candidature.objects.select_related(
            'student',
            'student__user',
            'student__student_course',
            'student__calendar'
        ).prefetch_related('candidature_proposals__proposal__company').get(id_candidature=pk)

        # 3. Verificar permissões
        if user_type == "student":
            student = Student.objects.get(user__email=user_email)
            if candidature.student.student_number != student.student_number:
                return Response(
                    {"message": "Sem permissão para ver esta candidatura"},
                    status=HTTP_401_UNAUTHORIZED
                )
        elif user_type not in ["admin", "academic_services"]:
            return Response(
                {"message": "Sem permissão para ver candidatura"},
                status=HTTP_403_FORBIDDEN
            )

        # 4. Obter propostas da candidatura
        candidature_proposals = candidature.candidature_proposals.all()
        proposals_list = []
        for cp in candidature_proposals:
            proposals_list.append({
                "id": cp.proposal.id_proposal,
                "title": cp.proposal.proposal_title,
                "company": {
                    "id": cp.proposal.company.id_company if cp.proposal.company else None,
                    "name": cp.proposal.company.company_name if cp.proposal.company else "ISEC"
                },
                "location": cp.proposal.location,
                "type": cp.proposal.get_proposal_type_display(),
                "state": cp.state
            })

        # 5. Obter estados disponíveis baseado no estado atual
        current_state = candidature.state
        available_next_states = get_available_next_states(current_state)

        # 6. Preparar resposta
        response_data = {
            "id_candidature": candidature.id_candidature,
            "state": candidature.state,
            "submission_date": candidature.candidature_submission_date.strftime("%d/%m/%Y"),
            "created_at": candidature.created_at.strftime("%d/%m/%Y %H:%M"),
            "last_updated": candidature.last_updated.strftime("%d/%m/%Y %H:%M"),
            "proposals": proposals_list,
            "student": {
                "student_number": candidature.student.student_number,
                "student_name": candidature.student.student_name,
                "course": candidature.student.student_course.course_name if candidature.student.student_course else None,
                "email": candidature.student.user.email
            },
            "available_next_states": available_next_states
        }

        return Response(response_data, status=HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
def updateCandidatureState(request, pk):
    print(f"🔄 Starting updateCandidatureState for ID: {pk}")
    try:
        auth_header = request.headers.get("Authorization")
        print(f"debug: auth_header present: {bool(auth_header)}")
        
        user_id, user_email, user_type = decode_token(auth_header)
        print(f"debug: decoded token: {user_email}, {user_type}")

        # 1. Autenticação
        if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
            return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

        # 2. Verificar permissões (apenas admin e academic_services)
        if user_type not in ["admin", "academic_services"]:
            return Response(
                {"message": "Sem permissão para alterar estado"},
                status=HTTP_403_FORBIDDEN
            )

        print("debug: permissions ok")

        # 3. Obter dados da requisição
        new_state = request.data.get("new_state")
        notes = request.data.get("notes", "")
        print(f"debug: new_state={new_state}")

        if not new_state:
            return Response({"message": "Novo estado é obrigatório"}, status=HTTP_400_BAD_REQUEST)

        # 4. Validar que novo estado existe no modelo
        valid_states = [choice[0] for choice in Candidature.STATE_CHOICES]
        if new_state not in valid_states:
            return Response(
                {"message": f"Estado '{new_state}' inválido"},
                status=HTTP_400_BAD_REQUEST
            )

        print("debug: state valid")

        # 5. Buscar candidatura
        candidature = Candidature.objects.get(id_candidature=pk)
        print(f"debug: candidature found: {candidature}")
        
        # 6. Validar transição de estado (Modificado: Permitir qualquer transição para correções manuais)
        current_state = candidature.state
        # available_next_states = get_available_next_states(current_state)
        
        # if new_state not in available_next_states and current_state != new_state:
        #    # Permitir mudar para qualquer estado válido
        #    pass

        # 7. Obter user que está fazendo a mudança (usar ID para garantir unicidade)
        user = Accounts.objects.get(pk=user_id)

        # 8. Atualizar validation_status do estudante se necessário
        if current_state == 'revision':
            student = candidature.student
            if new_state == 'protocol_generated':
                # Conta validada
                student.validation_status = 'validated'
                student.save()
                print(f"debug: student validation_status updated to 'validated'")
            elif new_state == 'finished':
                # Conta rejeitada
                student.validation_status = 'rejected'
                student.save()
                print(f"debug: student validation_status updated to 'rejected'")

        # 9. Alterar estado usando o método do modelo
        candidature.change_state(new_state, changed_by=user, notes=notes)

        # 10. Retornar candidatura atualizada
        return Response({
            "message": "Estado da candidatura atualizado com sucesso",
            "candidature": {
                "id": candidature.id_candidature,
                "old_state": current_state,
                "new_state": candidature.state,
                "student_name": candidature.student.student_name,
                "updated_at": candidature.last_updated.strftime("%d/%m/%Y %H:%M")
            }
        }, status=HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Accounts.DoesNotExist:
        return Response({"message": "Usuário não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ ERROR in updateCandidatureState: {str(e)}")
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_available_next_states(current_state):
    """
    Retorna lista de TODOS os estados disponíveis para permitir liberdade total de correção.
    """
    # Retorna todos os estados definidos no modelo
    return [choice[0] for choice in Candidature.STATE_CHOICES]

@api_view(['PUT'])
def updateCandidatureProposalState(request):
    """
    Endpoint para academic_services e admin alterarem o estado de uma proposta específica.
    Permite aceitar ou rejeitar propostas individuais dentro de uma candidatura.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    # 1. Autenticação
    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # 2. Verificar permissões (apenas admin e academic_services)
    if user_type not in ["admin", "academic_services"]:
        return Response(
            {"message": "Sem permissão para alterar estado de proposta"},
            status=HTTP_403_FORBIDDEN
        )

    try:
        # 3. Obter dados da requisição
        candidature_id = request.data.get("candidature_id")
        proposal_id = request.data.get("proposal_id")
        new_state = request.data.get("new_state")

        if not candidature_id or not proposal_id or not new_state:
            return Response(
                {"message": "Campos 'candidature_id', 'proposal_id' e 'new_state' são obrigatórios"},
                status=HTTP_400_BAD_REQUEST
            )

        # 4. Validar que novo estado é válido
        valid_states = [choice[0] for choice in CandidatureProposal.STATE_CHOICES]
        if new_state not in valid_states:
            return Response(
                {"message": f"Estado '{new_state}' não é válido. Estados permitidos: {valid_states}"},
                status=HTTP_400_BAD_REQUEST
            )

        # 5. Buscar CandidatureProposal
        candidature_proposal = CandidatureProposal.objects.select_related(
            'candidature',
            'candidature__student',
            'proposal'
        ).get(
            candidature_id=candidature_id,
            proposal_id=proposal_id
        )

        # 6. Salvar estado antigo
        old_state = candidature_proposal.state

        # 7. Atualizar estado
        candidature_proposal.state = new_state
        candidature_proposal.state_changed_at = timezone.now()
        candidature_proposal.save()

        # 8. Se aceitar uma proposta, rejeitar automaticamente as outras
        if new_state == 'accepted':
            CandidatureProposal.objects.filter(
                candidature=candidature_proposal.candidature
            ).exclude(
                proposal=candidature_proposal.proposal
            ).update(state='rejected', state_changed_at=timezone.now())

        return Response({
            "message": "Estado da proposta atualizado com sucesso",
            "candidature_proposal": {
                "candidature_id": candidature_proposal.candidature.id_candidature,
                "proposal_id": candidature_proposal.proposal.id_proposal,
                "proposal_title": candidature_proposal.proposal.proposal_title,
                "old_state": old_state,
                "new_state": candidature_proposal.state,
                "student_name": candidature_proposal.candidature.student.student_name
            }
        }, status=HTTP_200_OK)

    except CandidatureProposal.DoesNotExist:
        return Response(
            {"message": "Proposta não encontrada nesta candidatura"},
            status=HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def getActiveInternships(request):
    """
    Endpoint para academic_services e admin visualizarem todos os estágios ativos.
    Considera estados: placed, protocol_generated, presidency_signature, company_signature, student_signature, finished.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type not in ["admin", "academic_services"]:
        return Response(
            {"message": "Sem permissão para ver estágios ativos"},
            status=HTTP_403_FORBIDDEN
        )

    try:
        active_states = [
            'placed', 'protocol_generated', 'presidency_signature', 
            'company_signature', 'student_signature', 'finished'
        ]
        
        candidatures = Candidature.objects.filter(
            state__in=active_states
        ).select_related(
            'student', 
            'student__user',
            'student__student_course'
        ).prefetch_related('candidature_proposals__proposal__company')

        internships_list = []
        for candidature in candidatures:
            # Obter a proposta aceite
            proposal = None
            c_proposal = candidature.candidature_proposals.filter(state='accepted').first()
            if c_proposal:
                proposal = c_proposal.proposal
            
            # Se não houver aceite (teoricamente deveria haver logo que passa de 'submitted'), 
            # tenta a primeira da lista como fallback
            if not proposal:
                c_proposal = candidature.candidature_proposals.first()
                if c_proposal:
                    proposal = c_proposal.proposal

            company_name = "N/A"
            proposal_title = "N/A"
            if proposal:
                proposal_title = proposal.proposal_title
                if proposal.company:
                    company_name = proposal.company.company_name
                elif proposal.isec_advisor:
                    company_name = proposal.isec_advisor.teacher_name
                else:
                    company_name = "ISEC"

            internships_list.append({
                "id": candidature.id_candidature,
                "student": {
                    "number": candidature.student.student_number,
                    "name": candidature.student.student_name,
                    "course": candidature.student.student_course.course_name if candidature.student.student_course else "N/A",
                    "course_acronym": candidature.student.student_course.course_acronym if candidature.student.student_course else "N/A",
                    "email": candidature.student.user.email
                },
                "companyName": company_name,
                "proposalName": proposal_title,
                "state": candidature.state,
                "submissionDate": candidature.candidature_submission_date.strftime("%d/%m/%Y")
            })

        return Response(internships_list, status=HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )

