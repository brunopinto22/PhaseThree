import json
import os
import traceback

from django.contrib.auth import get_user_model
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



@api_view(['POST'])
def registerCompany(request):
    data = request.data.copy()

    if Company.objects.filter(company_email=data["company_email"]).exists():
        return Response({"message":"A Empresa já se encontra registada"}, status=status.HTTP_400_BAD_REQUEST)

    if Accounts.objects.filter(email=data["representative_email"]).exists():
        return Response({"message":"O Representante já se encontra registado"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            company = Company.objects.create(
                company_name = data["company_name"],
                company_email = data["company_email"],
                company_address = data["company_address"],
                company_postal_code = data["company_postal_code"],
                company_nipc = data["company_nipc"],
                company_contact = data["company_contact"],
                company_website = data["company_website"],
                company_linkedin = data["company_linkedin"],
            )

            user = Accounts.objects.create(
                username = data["representative_email"],
                email = data["representative_email"],
                user_type = 'representative'
            )
            user.set_password(data["representative_password"])
            user.save()

            representative = Representative.objects.create(
                user = user,
                representative_name=data["representative_name"],
                representative_role=data["representative_role"],
                representative_contact=data["representative_contact"],
                company=company,
            )

            company.company_admin = representative
            company.save()

            return Response({"message":"Empresa registada com sucesso"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        traceback.print_exc()
        return Response({"message":"Erro interno do servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def listCompanies(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para ver as Empresas"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        module = Module.objects.get(module_name='Empresas')
        permission = Permissions.objects.get(teacher=teacher, module=module)
        if not permission.can_view:
            return Response({"message": "Sem permissão para ver as Empresas"}, status=HTTP_401_UNAUTHORIZED)


    try:
        if not Teacher.objects.all().exists():
            return Response(
                {"message": "Nenhum docente encontrado"},
                status=status.HTTP_204_NO_CONTENT
            )

        companies = Company.objects.all()

        data = []
        for c in companies:
            data.append({
                "active": c.active,
                "id": c.id_company,
                "name": c.company_name,
                "email": c.company_email,
                "admin": {
                    "active": c.company_admin.active,
                    "name": c.company_admin.representative_name,
                    "email": c.company_admin.user.email,
                },
            })

        return JsonResponse(data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def getCompany(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        company = Company.objects.get(pk=pk)
        data = {
            "id": company.id_company,
            "name": company.company_name,
            "email": company.company_email,
            "address": company.company_address,
            "postal_code": company.company_postal_code,
            "nipc": company.company_nipc,
            "contact": company.company_contact,
            "website": company.company_website,
            "linkedin": company.company_linkedin,
            "active": company.active,
            "representatives_count": company.representatives.count(),
            "representatives": [
                {
                    "id": rep.id_representative,
                    "name": rep.representative_name,
                    "email": rep.user.email,
                    "role": rep.representative_role,
                    "admin": company.company_admin and rep.id_representative == company.company_admin.id_representative
                }
                for rep in company.representatives.all()
            ],
            "proposals_count": company.company_proposals.count(),
            "proposals": [
                {
                    "id": p.id_proposal,
                    "proposal_number": p.calendar_proposal_number,
                    "title": p.proposal_title,
                    "type": p.proposal_type,
                    "location": p.location,
                    "course": {
                        "id": p.course.id_course,
                        "name": p.course.course_name,
                        "acronym": ''.join(word[0] for word in p.course.course_name.split() if word[0].isupper()),
                    },
                    "branches": [
                        {
                            "name": b.branch_name,
                            "color": b.color,
                        }
                        for b in p.branches.all()
                    ],
                    "slots": p.slots,
                    "taken": p.students.count(),
                }
                for p in company.company_proposals.all()
            ]
        }

        return JsonResponse(data, status=HTTP_200_OK, safe=False)
    except Company.DoesNotExist:
        return Response({"message": "Empresa não foi encontrada."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"message": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
def editCompany(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher", "representative"]:
        return Response({"message": "Sem permissão para ver a Empresa"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        module = Module.objects.get(module_name='Empresas')
        permission = Permissions.objects.get(teacher=teacher, module=module)
        if not permission.can_edit:
            return Response({"message": "Sem permissão para editar a Empresas"}, status=HTTP_401_UNAUTHORIZED)

    elif user_type == "representative":
        try:
            company = Company.objects.get(id_company=pk)
            if user_email != company.company_admin.user.email:
                return Response({"message": "Sem permissão para editar a Empresa."}, status=HTTP_401_UNAUTHORIZED)
        except Exception as e:
            traceback.print_exc()
            return Response(
                {"message": "Erro interno do servidor", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    try:
        c = Company.objects.get(id_company=pk)

        c.company_name = request.data.get("name")
        c.company_email = request.data.get("email")
        c.company_address = request.data.get("address")
        c.company_postal_code = request.data.get("postal_code")
        c.company_nipc = request.data.get("nipc")
        c.company_contact = request.data.get("contact")
        c.company_website = request.data.get("website")
        c.company_linkedin = request.data.get("linkedin")

        c.save()

        return Response({"message":"Empresa editada com sucesso."}, status=status.HTTP_200_OK)

    except Company.DoesNotExist:
        return Response({"message": "Empresa não foi encontrada."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"message": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
def deleteCompany(request, pk):
    auth_header = request.headers.get("Authorization")

    return Response({"message": "deleteCompany"}, status=status.HTTP_200_OK)


@api_view(['POST'])
def invite(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["representative"]:
        return Response({"message": "Sem permissão para convidar um Representante"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        rep = Representative.objects.get(user__email=user_email)
        company = rep.company

        if Accounts.objects.filter(email=request.data.get("email")).exists():
            return Response({"message": "O utilizador já se encontra registado."}, status=status.HTTP_400_BAD_REQUEST)

        invite_link = (
            f"{settings.FRONTEND_URL}/register/representative"
            f"?invite=true&id={company.id_company}"
        )

        send_mail(
            subject="Convite para representar empresa",
            message=f"Foi convidado para se juntar à empresa {company.company_name} no Sistema de Gestão de Projetos e Estágios do ISEC.\nClique aqui para aceitar: {invite_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[request.data.get("email")],
            fail_silently=False,
        )

    except Company.DoesNotExist:
        return Response({"message": "Empresa não foi encontrada."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({"message": "Convite enviado com sucesso"}, status=status.HTTP_200_OK)
