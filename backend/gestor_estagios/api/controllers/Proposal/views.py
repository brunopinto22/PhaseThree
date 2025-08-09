import json
import os
import traceback

from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from rest_framework.status import *

from api.models import *
from api.permissions import *
from api.token_manager import *
from django.db import transaction
from datetime import date



@api_view(["GET"])
def getProposal(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        p = Proposal.objects.get(pk=pk)

        if user_type == "student":
            student = Student.objects.get(user__email=user_email)
            calendar = p.calendar

            if not calendar.students.filter(student=student).exists():
                return Response({"message":"Não pertence ao Calendário"}, status=HTTP_401_UNAUTHORIZED)

            if calendar.divulgation > date.today():
                return Response({"message":"Ainda não é possível ver as Propostas"}, status=HTTP_403_FORBIDDEN)

        data = {
            "title": p.proposal_title,
            "description": p.proposal_description,
            "technologies": p.proposal_technologies,
            "methodologies": p.proposal_methodologies,
            "objectives": p.proposal_objectives,
            "scheduling": p.proposal_scheduling,
            "selection": p.proposal_selection_method,
            "conditions": p.proposal_conditions,
            "format": p.work_format,
            "local": p.location,
            "schedule": p.schedule,
            "slots": p.slots,
            "taken": p.students.count(),
            "course": {
                "id": p.course.id_course,
                "title": p.course.course_name
            },
            "branches": [
                {
                    "id": b.id_branch,
                    "name": b.branch_name,
                    "acronym": b.branch_acronym,
                    "color": b.color,
                } for b in p.branches.all()
            ],
            "calendar": {
                "id": p.calendar.id_calendar,
                "title": p.calendar.__str__(),
            },
            "type": p.proposal_type,
            "company": {
                "id": p.company.id_company if p.company else None,
                "title": p.company.company_name if p.company else "ISEC"
            },
            "advisor": {
                "id": p.company_advisor.id_representative if p.company_advisor else None,
                "name": p.company_advisor.representative_name if p.company_advisor else None,
                "email": p.company_advisor.user.email if p.company_advisor else None,
            } if p.company_advisor else None,
            "isec_advisor": {
                "id": p.isec_advisor.id_teacher,
                "name": p.isec_advisor.teacher_name,
                "email": p.isec_advisor.user.email,
            } if p.isec_advisor else None,
        }

        return JsonResponse(data, status=status.HTTP_200_OK)

    except Proposal.DoesNotExist:
        return Response({"message": "A Proposta não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({ "error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["GET"])
def listProposals(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        proposals = Proposal.objects.all()

        if user_type == "student":
            student = Student.objects.get(user__email=user_email)
            proposals = proposals.filter(calendar__students__student=student)

        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            module = Module.objects.get(module_name='Propostas')
            permission = Permissions.objects.get(teacher=teacher, module=module)
            self_filter = request.query_params.get("self", "false").lower() == "true"

            if self_filter:
                proposals = proposals.filter(isec_advisor=teacher, company__isnull=True)
            elif not permission.can_view:
                proposals = proposals.filter(isec_advisor=teacher)

        elif user_type == "representative":
            rep = Representative.objects.get(user__email=user_email)
            proposals = proposals.filter(company=rep.company)


        data = [
            {
                "id": p.id_proposal,
                "type": p.proposal_type,
                "title": p.proposal_title,
                "company": p.company.company_name if p.company is not None else "ISEC",
                "location": p.location,
                "can_delete": p.calendar.divulgation > date.today(),
                "calendar": {
                    "id": p.calendar.id_calendar,
                    "title": p.calendar.__str__(),
                },
                "course": {
                    "id": p.course.id_course,
                    "name": p.course.course_name,
                    "acronym": ''.join(word[0] for word in p.course.course_name.split() if word[0].isupper()),
                },
                "slots": p.slots,
                "taken": p.students.count(),
            }
            for p in proposals
        ]

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            "error": "Erro interno do servidor",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def createProposal(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher", "representative"]:
        return Response({"message": "Sem permissão para para criar uma Proposta"}, status=HTTP_401_UNAUTHORIZED)

    try:
        data = request.data

        calendar = None
        company = None
        advisor = None
        advisor_isec = None

        course = Course.objects.get(id_course=request.data.get("course_id"))
        branches = Branch.objects.filter(id_branch__in=request.data.get("branches", []))

        if data.get("company_id") is not None:
            company = Company.objects.get(id_company=data.get("company_id"))

        if data.get("advisor_id") is not None:
            advisor = Representative.objects.get(id_representative=data.get("advisor_id"))
            if advisor.company.id_company != company.id_company:
                return Response({"message":"O Orientador não pertence à Empresa"}, status=HTTP_400_BAD_REQUEST)

        elif data.get("advisor_data") is not None:
            advisor_data = data.get("advisor_data")
            name = advisor_data.get("name")
            email = advisor_data.get("email")

            if Accounts.objects.filter(email=email).exists():
                return Response({"message": "O Representante já se encontra registado"}, status=status.HTTP_400_BAD_REQUEST)

            settings = Settings.objects.first()

            user = Accounts.objects.create(
                username = email,
                email = email,
                user_type = 'representative'
            )
            user.set_password(settings.representative_password)
            user.save()

            advisor = Representative.objects.create(
                user = user,
                representative_name=name,
                company=company,
            )

        elif data.get("advisor_isec_id") is not None:
            if data.get("proposal_type") != 2:
                return Response({"message":"Tipo de Proposta errada, deve ser do tipo Projeto"})
            advisor_isec = Teacher.objects.get(id_teacher=data.get("advisor_isec_id"))

        else:
            return Response({"message":"É necessário indicar um Orientador"}, status=HTTP_400_BAD_REQUEST)

        calendar = Calendar.objects.get(id_calendar=data.get("calendar_id"))
        if not calendar.submission_start <= date.today() <= calendar.submission_end:
            return Response({"message":"Fora de prazo para criar uma proposta"}, status=HTTP_400_BAD_REQUEST)

        if data.get("slots") == 0:
            return Response({"message":"Não é possível criar uma proposta sem vagas"}, status=HTTP_400_BAD_REQUEST)

        proposal = Proposal.objects.create(
            proposal_title=data.get("title"),
            proposal_description=data.get("description"),
            proposal_selection_method=data.get("selection"),
            proposal_conditions=data.get("conditions"),
            proposal_scheduling=data.get("scheduling"),
            proposal_technologies=data.get("technologies"),
            proposal_methodologies=data.get("methodologies"),
            proposal_objectives=data.get("objectives"),
            proposal_type=data.get("proposal_type"),
            course=course,
            work_format=data.get("work_format"),
            location=data.get("location"),
            schedule=data.get("schedule"),
            slots=data.get("slots"),
            calendar=calendar,
            proposal_submission_date=date.today(),
            company_advisor=advisor,
            isec_advisor=advisor_isec,
            company=company,
        )

        if branches.exists():
            proposal.branches.set(branches)

        proposal.save()

        return Response({"message": "Proposta criada com sucesso."}, status=HTTP_201_CREATED)

    except Course.DoesNotExist:
        return Response({"message": "Curso não encontrado."}, status=HTTP_404_NOT_FOUND)
    except Company.DoesNotExist:
        return Response({"message": "Empresa não encontrada."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({
            "error": "Erro interno do servidor",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["PUT"])
def editProposal(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # TODO : as vagas só podem ser mudadas enquanto não for divulgado ?

    return Response({"message": "editProposal"}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
def deleteProposal(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher", "representative"]:
        return Response({"message": "Sem permissão para para criar uma Proposta"}, status=HTTP_401_UNAUTHORIZED)

    try:
        proposal = Proposal.objects.get(pk=pk)

        if user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            self_proposal = proposal.isec_advisor == teacher and proposal.company is None

            if not self_proposal:
                module = Module.objects.get(module_name='Propostas')
                permission = Permissions.objects.get(teacher=teacher, module=module)
                if not permission.can_delete:
                    return Response({"message": "Sem permissão para eliminar Propostas"}, status=status.HTTP_401_UNAUTHORIZED)

        elif user_type == "representative":
            representative = Representative.objects.get(user__email=user_email)
            if proposal.company.company_admin != representative:
                return Response({"message": "Sem permissão para eliminar Propostas"}, status=status.HTTP_401_UNAUTHORIZED)


        if proposal.calendar.divulgation >= date.today():
            return Response({"message": "Não é possível eliminar a Proposta, já foi divulgada"}, status=status.HTTP_401_UNAUTHORIZED)

        proposal.delete()

        return Response({"message": "Proposta eliminada com sucesso."}, status=status.HTTP_200_OK)

    except Proposal.DoesNotExist:
        return Response({"message":"A Proposta não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": "Erro interno do servidor",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
