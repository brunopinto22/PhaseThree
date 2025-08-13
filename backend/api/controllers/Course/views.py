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
def getCourse(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        c = Course.objects.get(pk=pk)
        data = {
            "course_name": c.course_name,
            "scientific_area_id": c.scientific_area.id_area,
            "scientific_area_name": c.scientific_area.area_name,
            "course_description": c.course_description,
            "commission_email": c.commission_email,
            "website": c.course_website,
            "nStudents": Student.objects.filter(student_course=c).count(),
            "nTeachers": Teacher.objects.filter(scientific_area=c.scientific_area).count(),
            "nProposals": Proposal.objects.filter(calendar__course=c).count(),
            "technologies_active": c.technologies_active,
            "methodologies_active": c.methodologies_active,
            "objectives_active": c.objectives_active,
            "branches": list(Branch.objects.filter(id_course=c).values(
                "id_branch",
                "branch_name",
                "branch_acronym",
                "color"
            )),
            "commission": [
                {
                    "teacher_id": t.id_teacher,
                    "teacher_name": t.teacher_name,
                    "teacher_email": t.user.email,
                    "is_responsible": bool(c.responsible and t.id_teacher == c.responsible.id_teacher)
                }
                for t in sorted(
                    c.commission.all(),
                    key=lambda t: (0 if c.responsible and t.id_teacher == c.responsible.id_teacher else 1, t.teacher_name.lower())
                )
            ],
            "calendars": [
                {
                    "id": cl.id_calendar,
                    "active": cl.submission_start <= date.today() <= cl.placements,
                    "title": cl.__str__(),
                    "submissionStart": cl.submission_start.strftime("%d/%m/%Y"),
                    "submissionEnd": cl.submission_end.strftime("%d/%m/%Y"),
                    "divulgation": cl.divulgation.strftime("%d/%m/%Y"),
                    "registrations": cl.registrations.strftime("%d/%m/%Y"),
                    "candidatures": cl.candidatures.strftime("%d/%m/%Y"),
                    "placements": cl.placements.strftime("%d/%m/%Y"),
                }
                for cl in Calendar.objects.filter(course=c).all()
            ],
        }

        return JsonResponse(data, status=HTTP_200_OK, safe=False)
    except Course.DoesNotExist:
        return Response({"message": "Curso não encontrado."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def listCourses(request):
    try:
        if not Course.objects.all().exists():
            return Response(
                {"message": "Nenhum Curso encontrado"},
                status=status.HTTP_204_NO_CONTENT
            )

        courses = Course.objects.prefetch_related('branches').all()

        data = []
        for c in courses:
            data.append({
                "id": c.id_course,
                "name": c.course_name,
                "acronym": ''.join(word[0] for word in c.course_name.split() if word[0].isupper()),
                "email": c.commission_email,
                "num_branches": c.branches.count(),
                "active_calendars": any(cl.submission_start <= date.today() <= cl.placements for cl in Calendar.objects.filter(course=c).all()),
                "active_calendars_submission": any(cl.submission_start <= date.today() <= cl.submission_end for cl in Calendar.objects.filter(course=c).all()),
                "active_calendars_registrations": any(date.today() <= cl.registrations for cl in Calendar.objects.filter(course=c).all()),
            })

        return JsonResponse(data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        traceback.print_exc()
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["POST"])
def createCourse(request):
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
        student_module = Module.objects.get(module_name='Cursos')
        permission = Permissions.objects.get(teacher=teacher, module=student_module)
        if not permission.can_edit:
            return Response({"message": "Sem permissão para criar um Curso"}, status=HTTP_401_UNAUTHORIZED)

    try:
        data = request.data.copy()

        if Course.objects.filter(course_name=data["course_name"]).exists():
            return Response({"message":"Curso já se econtra registado."}, status=status.HTTP_400_BAD_REQUEST)

        course = Course.objects.create(
            course_name=data["course_name"],
            course_description=data["course_description"],
            course_website=data["course_website"],
            technologies_active=data["technologies_active"],
            methodologies_active=data["methodologies_active"],
            objectives_active=data["objectives_active"],
            scientific_area=ScientificArea.objects.get(id_area=data["scientific_area"]),
            commission_email=data["email"],
        )

        for admin in data.get("admins", []):
            course.add_admin(admin["teacher_id"])
            if admin.get("is_responsible", False):
                course.set_responsible(admin["teacher_id"])

        for branch in data.get("branches", []):
            course.add_branch(name=branch["branch_name"], acronym=branch["branch_acronym"], color=branch.get("branch_color"))

        return Response({"message":"Curso criado com sucesso."}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"message": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["PUT"])
def editCourse(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para editar um Curso"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        try:
            teacher = Teacher.objects.get(user__email=user_email)
        except Teacher.DoesNotExist:
            return Response({"message": "Docente não encontrado"}, status=HTTP_404_NOT_FOUND)

        has_permission = False

        try:
            course_module = Module.objects.get(module_name='Cursos')
            permission = Permissions.objects.get(teacher=teacher, module=course_module)
            if permission.can_edit:
                has_permission = True
        except Permissions.DoesNotExist:
            pass

        try:
            course = Course.objects.get(id_course=pk)
            if course.commission.filter(id=teacher.id).exists():
                has_permission = True
        except Course.DoesNotExist:
            return Response({"message": "Curso não encontrado"}, status=HTTP_404_NOT_FOUND)

        if not has_permission:
            return Response({"message": "Sem permissão para editar um Curso"}, status=HTTP_401_UNAUTHORIZED)

    try:
        c = Course.objects.get(pk=pk)
        data = request.data.copy()

        c.course_name = data["course_name"]
        c.course_description = data["course_description"]
        c.course_website = data["course_website"]
        c.technologies_active = data["technologies_active"]
        c.methodologies_active = data["methodologies_active"]
        c.objectives_active = data["objectives_active"]
        c.scientific_area = ScientificArea.objects.get(id_area=data["scientific_area"])
        c.commission_email = data["email"]

        c.save()

        b = Branch.objects.filter(id_course=c).all()
        processed = set()

        for branch_data in data.get("branches", []):
            id = branch_data.get("branch_id")

            if id and not str(id).startswith("temp_"):
                c.edit_branch(id, branch_data["branch_name"], branch_data["branch_acronym"], branch_data.get("branch_color"))
                processed.add(int(id))
            else:
                c.add_branch(name=branch_data["branch_name"], acronym=branch_data["branch_acronym"],color=branch_data.get("branch_color"))

        for branch in b:
            if branch.id_branch not in processed:
                c.remove_branch(branch.id_branch)

        admins = data.get("admins", [])
        new_commission_ids = set()
        responsible_teacher_id = None

        for admin in admins:
            tid = admin.get("teacher_id")
            if tid is None:
                continue
            new_commission_ids.add(tid)
            if admin.get("is_responsible"):
                responsible_teacher_id = tid

        current_commission_ids = set(c.commission.values_list("id_teacher", flat=True))
        to_remove = current_commission_ids - new_commission_ids
        for teacher_id in to_remove:
            try:
                c.remove_admin(teacher_id)
            except ValueError as e:
                print(f"Remove error: {e}")

        to_add = new_commission_ids - current_commission_ids
        for teacher_id in to_add:
            try:
                c.add_admin(teacher_id)
            except ValueError as e:
                print(f"Add error: {e}")

        if responsible_teacher_id:
            try:
                c.set_responsible(responsible_teacher_id)
            except ValueError as e:
                print(f"Responsible error: {e}")

        c.save()

        return Response({"message": "Curso editado com sucesso."}, status=status.HTTP_200_OK)

    except Course.DoesNotExist:
        return Response({"message": "O Curso não foi encontrado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"message": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["DELETE"])
def deleteCourse(request, pk):
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

    try:
        course = Course.objects.get(id_course=pk)
        course.delete()

        return Response({"message": "Curso eliminado com sucesso."}, status=status.HTTP_200_OK)

    except Course.DoesNotExist:
        return Response({"message": "O Curso não foi encontrado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"message": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
