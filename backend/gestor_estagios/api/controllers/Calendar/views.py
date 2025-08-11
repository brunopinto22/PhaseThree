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
def getCalendar(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        c = Calendar.objects.get(id_calendar=pk)

        data = {
            "title": c.__str__(),
            "year": c.calendar_year,
            "semester": c.calendar_semester,
            "submission_start": c.submission_start,
            "submission_end": c.submission_end,
            "registrations": c.registrations,
            "divulgation": c.divulgation,
            "candidatures": c.candidatures,
            "placements": c.placements,
            "min": c.min_proposals,
            "max": c.max_proposals,
            "course_id": c.course.id_course,
            "course_name": c.course.course_name,
            "students_count": c.students.count(),
            "students": [
                {
                    "number": s.student_number,
                    "name": s.student_name,
                    "email": s.user.email,
                    "course": s.student_course.course_name,
                    "branch": s.student_branch.branch_name,
                }
                for s in c.students.all()
            ],
            "proposals_count": Proposal.objects.filter(calendar=c).count(),
            "proposals":[
                {
                    "id": p.id_proposal,
                    "proposal_number": p.calendar_proposal_number,
                    "title": p.proposal_title,
                    "company": {
                        "id": p.company.id_company if p.company else None,
                        "name": p.company.company_name if p.company else "ISEC",
                    },
                    "course": {
                        "id": p.course.id_course,
                        "name": p.course.course_name
                    },
                    "location": p.location,
                    "slots": p.slots,
                    "taken": p.students.count(),
                    "type": p.proposal_type,
                }
                for p in Proposal.objects.filter(calendar=c)
            ]
        }

        return JsonResponse(data, status=HTTP_200_OK, safe=False)

    except Calendar.DoesNotExist:
        return Response({"message": "Calendário não encontrado."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({"error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def createCalendar(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    course_id = request.data.get("course_id")
    if not course_id:
        return Response({"message": "course_id obrigatório"}, status=HTTP_400_BAD_REQUEST)

    if user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para criar um Calendário"}, status=HTTP_401_UNAUTHORIZED)

    if user_type == "teacher":
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
            course = Course.objects.get(id_course=course_id)
            if course.commission.filter(id=teacher.id).exists():
                has_permission = True
        except Course.DoesNotExist:
            return Response({"message": "Curso não encontrado"}, status=HTTP_404_NOT_FOUND)

        if not has_permission:
            return Response({"message": "Sem permissão para criar um Calendário"}, status=HTTP_401_UNAUTHORIZED)

    try:
        course = Course.objects.get(id_course=course_id)
        calendar = Calendar.objects.create(
            calendar_year=request.data.get("year"),
            calendar_semester=request.data.get("semester"),
            submission_start=request.data.get("submission_start"),
            submission_end=request.data.get("submission_end"),
            divulgation=request.data.get("divulgation"),
            registrations=request.data.get("registrations"),
            candidatures=request.data.get("candidatures"),
            placements=request.data.get("placements"),
            min_proposals=request.data.get("min"),
            max_proposals=request.data.get("max"),
            course=course,
        )
        calendar.save()

        return Response({"message":"Calendário criado com sucesso."}, status=status.HTTP_201_CREATED)
    except Course.DoesNotExist:
        return Response({"message": "Calendário não encontrado."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
def editCalendar(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para editar um Calendário"}, status=HTTP_401_UNAUTHORIZED)

    try:
        calendar = Calendar.objects.get(pk=pk)
    except Calendar.DoesNotExist:
        return Response({"message": "Calendário não encontrado"}, status=HTTP_404_NOT_FOUND)

    if user_type == "teacher":
        try:
            teacher = Teacher.objects.get(user__email=user_email)
        except Teacher.DoesNotExist:
            return Response({"message": "Docente não encontrado"}, status=HTTP_404_NOT_FOUND)

        has_permission = False

        try:
            calendar_module = Module.objects.get(module_name='Calendários')
            permission = Permissions.objects.get(teacher=teacher, module=calendar_module)
            if permission.can_edit:
                has_permission = True
        except Permissions.DoesNotExist:
            pass

        course = calendar.course
        if course.commission.filter(id=teacher.id).exists():
            has_permission = True

        if not has_permission:
            return Response({"message": "Sem permissão para editar este Calendário"}, status=HTTP_401_UNAUTHORIZED)

    try:
        calendar.year = request.data.get("year"),
        calendar.semester = request.data.get("semester"),
        calendar.submission_start = request.data.get("submission_start", calendar.submission_start)
        calendar.submission_end = request.data.get("submission_end", calendar.submission_end)
        calendar.divulgation = request.data.get("divulgation", calendar.divulgation)
        calendar.candidatures = request.data.get("candidatures", calendar.candidatures)
        calendar.registrations = request.data.get("registrations", calendar.registrations)
        calendar.placements = request.data.get("placements", calendar.placements)
        calendar.min_proposals = request.data.get("min", calendar.min_proposals)
        calendar.max_proposals = request.data.get("max", calendar.max_proposals)

        calendar.save()

        return Response({"message": "Calendário editado com sucesso."}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
def deleteCalendar(request, pk):
    auth_header = request.headers.get("Authorization")

    return Response({"message": "deleteCalendar"}, status=status.HTTP_200_OK)