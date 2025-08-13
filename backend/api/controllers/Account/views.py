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



@api_view(["POST"])
def login(request):
    data = request.data
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return Response({"message": "Email e palavra-passe são obrigatórios."}, status=HTTP_400_BAD_REQUEST)

    user = Accounts.objects.filter(email=email).first()

    if user is None or not user.check_password(password):
        return Response({"message": "Email ou Palavra-passe inválidos."}, status=HTTP_401_UNAUTHORIZED)

    token = generate_token(user.pk, user.email, user.user_type)

    response_data = {
        "message": "Autenticação com sucesso",
        "access_token": str(token),
        "refresh_token": str(token),
        "type": user.user_type,
        "valid": "1",
    }

    if user.user_type == "student":
        try:
            student = Student.objects.get(user=user)
            response_data["id"] = student.student_number
        except Student.DoesNotExist:
            response_data["id"] = None

    elif user.user_type == "teacher":
        try:
            teacher = Teacher.objects.get(user=user)
            response_data["id"] = teacher.id_teacher

            perms = teacher.getPermissions()
            p = {
                perm.module.module_name: {
                    "view": perm.can_view,
                    "edit": perm.can_edit,
                    "delete": perm.can_delete
                } for perm in perms
            }
            response_data["permissions"] = p
        except Teacher.DoesNotExist:
            response_data["id"] = None
            response_data["permissions"] = {}

    elif user.user_type == "representative":
        try:
            rep = Representative.objects.get(user=user)
            response_data["id"] = rep.id_representative
            response_data["company_id"] = rep.company.id_company
        except Representative.DoesNotExist:
            response_data["id"] = None
            response_data["company_id"] = None

    return Response(response_data, status=200)


@api_view(["GET"])
def authenticate(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)


@api_view(["PATCH"])
def setPassword(request):
    module_map = {
        "student": "Alunos",
        "teacher": "Docentes",
        "representative": "Empresas"
    }

    data = request.data.copy()
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        current = None
        if user_type == "admin" and data.get("email") == "admin":
            current = Accounts.objects.get(user_type="admin")
        else:
            current = Accounts.objects.get(email=user_email)
        target = Accounts.objects.get(email=data.get("email"))

        can_change = False

        if current == target:
            old_password = data.get("old_password")
            if not old_password:
                return Response({"message": "É necessário indicar a palavra-passe antiga"},
                                status=status.HTTP_400_BAD_REQUEST)
            if not current.check_password(old_password):
                return Response({"message": "Palavra-passe antiga incorreta"}, status=status.HTTP_400_BAD_REQUEST)
            can_change = True

        elif current.user_type == "admin":
            can_change = True

        elif current.user_type == "teacher":
            module_name = module_map.get(target.user_type)
            teacher = Teacher.objects.get(user=current)
            if module_name:
                course_module = Module.objects.get(module_name=module_name)
                permission = Permissions.objects.get(teacher=teacher, module=course_module)
                if permission.can_edit:
                    can_change = True

        if not can_change:
            return Response({"message": "Sem permissão para alterar a palavra-passe"}, status=status.HTTP_403_FORBIDDEN)

        target.set_password(data.get("new_password"))
        target.save()

        return Response({"detail": "Palavra-passe atualizada com sucesso"}, status=HTTP_200_OK)
    except Accounts.DoesNotExist:
        return Response({"detail": "O utilizador não foi encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def recuperar_password(request):
    data = json.loads(request.body)
    email = data.get("email")
    try:
        user = Accounts.objects.get(email=email)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = (
            "{front_end_url}/login/password/recover/confirm/{uid}/{token}/".format(
                front_end_url=os.getenv("FRONT_END_URL"), uid=uid, token=token
            )
        )
        send_mail(
            "Password Reset Request",
            f"Click the link to reset your password:\n {reset_link}",
            "from@example.com",
            [email],
            fail_silently=False,
        )
        return Response(
            {"message": "Email para recuperação da password enviado"}, status=HTTP_200_OK
        )
    except Accounts.DoesNotExist:
        print("User not found")
        return Response({"message": "Utilizador não encontrado"}, status=HTTP_404_NOT_FOUND)


@api_view(["GET"])
def recuperar_password_confirm(request, uidb64, token):
    data = json.loads(request.body)
    new_password = data.get("new_password")
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = Accounts.objects.get(pk=uid)
        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return JsonResponse({"message": "Password alterada"}, status=HTTP_200_OK)
        else:
            return JsonResponse({"error": "Token inválido"}, status=HTTP_400_BAD_REQUEST)
    except (TypeError, ValueError, OverflowError, Accounts.DoesNotExist):
        return JsonResponse({"error": "Utilizador inválido"}, status=HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def summary(request):
    data = request.data.copy()
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        data = None

        if user_type == "admin":
            data = {
                "nCourses": Course.objects.count(),
                "nTeachers": Teacher.objects.count(),
                "nStudents": Student.objects.count(),
                "nCompanies": Company.objects.count(),
                "nRepresentatives": Representative.objects.count(),
                "nProposals": Proposal.objects.count(),
                "nCandidatures": Candidature.objects.count(),
            }

        elif user_type == "teacher":
            t = Teacher.objects.get(user__email=user_email)

            module_counts = {"nCourses": None,"nStudents": None,"nTeachers": None,"nCompanies": None,"nProposals": None,"nCandidatures": None,}
            for perm in Permissions.objects.filter(teacher=t, can_view=True):
                if perm.module.module_name == "Cursos":
                    module_counts["nCourses"] = Course.objects.count()
                elif perm.module.module_name == "Alunos":
                    module_counts["nStudents"] = Student.objects.count()
                elif perm.module.module_name == "Docentes":
                    module_counts["nTeachers"] = Teacher.objects.count()
                elif perm.module.module_name == "Empresas":
                    module_counts["nCompanies"] = Company.objects.count()
                    module_counts["nRepresentatives"] = Representative.objects.count()
                elif perm.module.module_name == "Propostas":
                    module_counts["nProposals"] = Proposal.objects.count()
                elif perm.module.module_name == "Candidaturas":
                    module_counts["nCandidatures"] = Candidature.objects.count()

            calendars_list = [
                {
                    "id": c.id_calendar,
                    "title": str(c)
                }
                for c in Calendar.objects.filter(course__scientific_area=t.scientific_area) if c.is_active()
            ]

            course_commission = Course.objects.filter(commission=t).first()
            if course_commission:
                data = {
                    "permissions": module_counts,
                    "commission": {
                        "course": {
                            "id": course_commission.id_course,
                            "name": course_commission.course_name
                        },
                        "nStudents": Student.objects.filter(student_course=course_commission).count(),
                        "nTeachers": course_commission.commission.count(),
                        "nCalendars": Calendar.objects.filter(course=course_commission).count()
                    },
                    "calendars": calendars_list,
                }
            else:
                data = {
                    "permissions": module_counts,
                    "commission": None,
                    "calendars": calendars_list
                }

        elif user_type == "representative":
            r = Representative.objects.get(user__email=user_email)

            data = {
                "company": {
                    "id": r.company.id_company,
                    "name": r.company.company_name,
                },
                "nRepresentatives": Representative.objects.filter(company=r.company).count(),
                "nProposals": Proposal.objects.filter(company=r.company).count(),
                "calendars": [
                    {
                        "id": c.id_calendar,
                        "title": str(c)
                    }
                    for c in Calendar.objects.all() if c.is_submission_active()
                ]
            }

        elif user_type == "student":
            s = Student.objects.get(user__email=user_email)
            c = Calendar.objects.get(id_calendar=s.calendar.id_calendar)

            data = {
                "calendar": {
                    "id": c.id_calendar,
                    "title": str(c),
                    "submission_start": c.submission_start.strftime("%d/%m/%Y"),
                    "submission_end": c.submission_end.strftime("%d/%m/%Y"),
                    "divulgation": c.divulgation.strftime("%d/%m/%Y"),
                    "candidatures": c.candidatures.strftime("%d/%m/%Y"),
                    "placements": c.placements.strftime("%d/%m/%Y"),
                }
            }

        else:
            return Response({"message": "Tipo de utilizador não reconhecido ou não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        return JsonResponse(data, status=200)

    except Exception as e:
        traceback.print_exc()
        return Response({"message": "Erro interno do servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)