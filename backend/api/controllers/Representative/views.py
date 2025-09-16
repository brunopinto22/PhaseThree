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



@api_view(["GET"])
def getRepresentative(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        r = Representative.objects.get(id_representative=pk)

        data = {
            "active": r.active,
            "pfp": request.build_absolute_uri(r.user.photo.url) if r.user.photo else None,
            "name": r.representative_name,
            "role": r.representative_role,
            "email": r.user.email,
            "contact": r.representative_contact,
            "company_id": r.company.id_company,
            "company_name": r.company.company_name,
            "can_edit_company": r.company.company_admin.id_representative == r.id_representative,
            "can_edit": user_type == "admin" or r.user.email == user_email,
        }

        return JsonResponse(data, status=HTTP_200_OK, safe=False)

    except Representative.DoesNotExist:
        return Response({"message": "Representante não foi encontrado."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
def registerRepresentative(request):
    data = request.data.copy()


    try:
        company = Company.objects.get(id_company=data["company_id"])
    except Company.DoesNotExist as e:
        return Response({"message":"A Empresa não foi encontrada"}, status=status.HTTP_400_BAD_REQUEST)

    if Accounts.objects.filter(email=data["representative_email"]).exists():
        return Response({"message":"O Representante já se encontra registado"}, status=status.HTTP_400_BAD_REQUEST)


    user = Accounts.objects.create(
        username=data["representative_email"],
        email=data["representative_email"],
        user_type='representative'
    )
    user.set_password(data["representative_password"])
    user.save()

    representative = Representative.objects.create(
        user=user,
        representative_name=data["representative_name"],
        representative_role=data["representative_role"],
        representative_contact=data["representative_contact"],
        company=company,
    )

    return Response({"message":"Representante registado com sucesso"}, status=status.HTTP_201_CREATED)



@api_view(["POST"])
def createRepresentative(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para criar um Curso"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        student_module = Module.objects.get(module_name='Empresas')
        permission = Permissions.objects.get(teacher=teacher, module=student_module)
        if not permission.can_edit:
            return Response({"message": "Sem permissão para criar um Representante"}, status=HTTP_401_UNAUTHORIZED)

    return Response({"message": "createRepresentative"}, status=HTTP_200_OK)

@api_view(["PUT"])
def editRepresentative(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)
    has_permission = False

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type == "representative":
        rep = Representative.objects.get(pk=pk)
        self = Representative.objects.get(user__email=user_email)
        if rep != self or (self.company == rep.company and self.company.company_admin != self):
            return Response({"error":"Sem permissão para para editar o Representante"}, status=status.HTTP_403_FORBIDDEN)

    elif user_type not in ["admin", "teacher"]:
        return Response({"error": "Sem permissão para para editar o Representante"}, status=status.HTTP_403_FORBIDDEN)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        student_module = Module.objects.get(module_name='Alunos')
        permission = Permissions.objects.get(teacher=teacher, module=student_module)
        has_permission = True
        if not permission.can_edit:
            return Response({"detail": "Sem permissão para para editar o Representante"}, status=HTTP_401_UNAUTHORIZED)

    try:
        data = request.data
        rep = Representative.objects.get(pk=pk)

        if Accounts.objects.filter(email=data["email"]).exclude(pk=rep.user.pk).exists():
            return Response({"message": "Este email já está em uso"}, status=status.HTTP_400_BAD_REQUEST)


        if user_type == "admin" or (user_type == "teacher" and has_permission):
            rep.active = data['active']

        rep.user.email = data["email"]
        rep.user.save()

        rep.representative_name = data["name"]
        rep.representative_role = data["role"]
        rep.representative_contact = data["contact"]

        rep.save()

        return Response({"message": "Representante atualizado com sucesso"}, status=status.HTTP_200_OK)

    except Representative.DoesNotExist:
        return Response({"error": "Representante não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["DELETE"])
def deleteRepresentative(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para eliminar um Curso"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        course_module = Module.objects.get(module_name='Cursos')
        permission = Permissions.objects.get(teacher=teacher, module=course_module)
        if not permission.can_delete:
            return Response({"message": "Sem permissão para eliminar um Curso"}, status=HTTP_401_UNAUTHORIZED)

    return Response({"message": "deleteRepresentative"}, status=HTTP_200_OK)