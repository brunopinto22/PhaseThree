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



@api_view(['GET'])
def getTeacher(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    get_permissions = False

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        if teacher.id_teacher == pk:
            get_permissions = True
        else:
            teacher_module = Module.objects.get(module_name='Docentes')
            permission = Permissions.objects.get(teacher=teacher, module=teacher_module)
            if not permission.can_view:
                return Response({"detail": "Sem permissão para para ver o Docente"}, status=HTTP_401_UNAUTHORIZED)
            if permission.can_edit:
                get_permissions = True

    elif user_type == "admin":
        get_permissions = True

    try:
        teacher = Teacher.objects.select_related("user", "scientific_area").get(id_teacher=pk)
    except Teacher.DoesNotExist:
        return Response({"error": "Docente não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": "Erro interno do servidor", "details": str(e)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    modules = Module.objects.all()
    perms_queryset = Permissions.objects.filter(teacher=teacher)
    permissions = {}

    for perm in perms_queryset:
        permissions[perm.module.module_name] = {
            "view": perm.can_view,
            "edit": perm.can_edit,
            "delete": perm.can_delete
        }

    response_data = {
        "pfp": request.build_absolute_uri(teacher.user.photo.url) if teacher.user.photo else None,
        "teacher_name": teacher.teacher_name,
        "teacher_category": teacher.teacher_category,
        "teacher_email": teacher.user.email,
        "scientific_area_id": teacher.scientific_area.id_area,
        "scientific_area_name": teacher.scientific_area.area_name,
        "active": teacher.active,
        "commissions": [
            {
                "id_course": c.id_course,
                "course_name": c.course_name
            }
            for c in teacher.course_commission.all()
        ]
    }

    if get_permissions:
        response_data["permissions"] = permissions

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def listTeachers(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    has_permission = False
    is_in_commission = False
    user_area = None

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para ver os Docentes"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        try:
            teacher = Teacher.objects.select_related('scientific_area', 'user').get(user__email=user_email)
            user_area = teacher.scientific_area
            teacher_module = Module.objects.get(module_name='Docentes')
            permission = Permissions.objects.filter(teacher=teacher, module=teacher_module, can_view=True).exists()
            has_permission = permission
            is_in_commission = Course.objects.filter(commission=teacher).exists()

            if not has_permission and not is_in_commission:
                return Response({"message": "Sem permissão para ver os Docentes"}, status=status.HTTP_401_UNAUTHORIZED)
        except Teacher.DoesNotExist:
            return Response({"message": "Professor não encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Module.DoesNotExist:
            return Response({"message": "Módulo 'Docentes' não encontrado"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        if not Teacher.objects.all().exists():
            return Response({"message": "Nenhum docente encontrado"}, status=status.HTTP_204_NO_CONTENT)

        teachers = Teacher.objects.all()

        data = []
        for t in teachers:
            data.append({
                "id_teacher": t.id_teacher,
                "teacher_name": t.teacher_name,
                "teacher_email": t.user.email,
                "scientific_area": t.scientific_area.id_area,
                "scientific_area_name": t.scientific_area.area_name,
                "active": t.active
            })

        if user_type == "teacher" and not has_permission and is_in_commission:
            data = [d for d in data if d['active'] and d['scientific_area'] == user_area.id_area]

        return JsonResponse(data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        return Response({"error": "Erro interno do servidor", "details": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def createTeacher(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para para criar o Docente"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        teacher_module = Module.objects.get(module_name='Docentes')
        permission = Permissions.objects.get(teacher=teacher, module=teacher_module)
        if not permission.can_edit:
            return Response({"message": "Sem permissão para para criar o Docente"}, status=HTTP_401_UNAUTHORIZED)

    try:
        data = request.data.copy()

        if Accounts.objects.filter(email=data["email"]).exists():
            return Response({"message": "Email já está em uso"}, status=status.HTTP_400_BAD_REQUEST)
        if not ScientificArea.objects.filter(id_area=data["area"]).exists():
            return Response({"message": "Área Científica não existe"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            settings = Settings.objects.first()

            user = Accounts.objects.create(
                username=data["email"],
                email=data["email"],
                user_type='teacher',
            )
            user.set_password(settings.teacher_password)
            user.save()

            teacher = Teacher.objects.create(
                user=user,
                teacher_name=data["name"],
                teacher_category=data["category"],
                active=True,
                scientific_area=ScientificArea.objects.get(id_area=data["area"])
            )

            permission_data = data.get("permissions", {})
            modules = Module.objects.all()

            for module in modules:
                mod_perms = permission_data.get(module.module_name, {})

                Permissions.objects.create(
                    teacher=teacher,
                    module=module,
                    can_view=mod_perms.get("view", False),
                    can_edit=mod_perms.get("edit", False),
                    can_delete=mod_perms.get("delete", False)
                )

        return Response({"message": "Docente criado com sucesso"}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def editTeacher(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    has_permission = False

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para editar o Docente"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        if teacher.id_teacher != pk:
            module = Module.objects.get(module_name='Docentes')
            permission = Permissions.objects.get(teacher=teacher, module=module)
            if not permission.can_edit or teacher != Teacher.objects.get(id_teacher=id):
                return Response({"message": "Sem permissão para editar o Docente"}, status=HTTP_401_UNAUTHORIZED)
            has_permission = True

    try:
        t = Teacher.objects.get(id_teacher=pk)
        data = request.data

        if Accounts.objects.filter(email=data['email']).exclude(pk=t.user.pk).exists():
            return Response({"message": "Este email já está em uso"}, status=HTTP_400_BAD_REQUEST)

        if user_type == "admin" or (user_type == "teacher" and has_permission and user_email != t.user.email):
            t.active = data['active']
        t.teacher_name = data['name']
        t.scientific_area = ScientificArea.objects.get(id_area=data['area'])
        t.teacher_category = data['category']
        t.user.email = data['email']
        t.user.save()
        t.save()

        if 'permissions' in data:
            permission_data = data.get('permissions', {})
            modules = Module.objects.all()

            for module in modules:
                mod_perms = permission_data.get(module.module_name, {})
                t.editPermissions(module.module_name, mod_perms.get('view', False), mod_perms.get('edit', False), mod_perms.get('delete', False))

        return Response({"message":"Docente atualizado com sucesso"}, status=status.HTTP_200_OK)

    except Teacher.DoesNotExist:
        return Response({"message": "Docente não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({"message": "Erro interno do servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def deleteTeacher(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher"]:
        return Response({"error": "Sem permissão para eliminar o Docente"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        teacher_module = Module.objects.get(module_name='Docentes')
        permission = Permissions.objects.get(teacher=teacher, module=teacher_module)
        if not permission.can_delete:
            return Response({"detail": "Sem permissão para eliminar o Docente"}, status=HTTP_401_UNAUTHORIZED)

    try:
        teacher = Teacher.objects.get(id_teacher=pk)
        teacher.active = False
        teacher.save()
        return Response({"detail": "Docente eliminado com sucesso"}, status=status.HTTP_200_OK)
    except Teacher.DoesNotExist:
        return Response({"error": "Docente não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)