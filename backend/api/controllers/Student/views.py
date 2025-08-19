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
def getStudent(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        student = Student.objects.get(student_number=pk)

        data = {
            "pfp": request.build_absolute_uri(student.user.photo.url) if student.user.photo else None,
            "active": student.active,
            "name": student.student_name,
            "student_number": student.student_number,
            "email": student.user.email,
            "nif": student.nif,
            "gender": student.gender,
            "nationality": student.nationality,
            "ident_type": student.ident_type,
            "ident_doc": student.ident_doc,
            "address": student.address,
            "contact": student.contact,
            "year": student.current_year,
            "ects": student.student_ects,
            "average": student.average,
            "subjects_done": student.subjects_done,
            "course": {
                "id": student.student_course.id_course,
                "name": student.student_course.course_name
            },
            "branch": {
                "id": student.student_branch.id_branch if student.student_branch else None,
                "name": student.student_branch.branch_name if student.student_branch else None
            },
            "calendar": {
                "id": student.calendar.id_calendar if student.calendar else None,
                "title": student.calendar.__str__() if student.calendar else None,
            },
            "subjects": [
                {
                    "name": subject.subject_name,
                    "state": subject.state,
                }
                for subject in student.subjects.all()
            ],
            "curriculum": student.curriculum.url if student.curriculum else None,
        }

        return Response(data, status=status.HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({"message": "Aluno não foi encontrado"},status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({"message": "Erro interno do servidor", "details": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def listStudents(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    elif user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para para ver os Alunos"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        student_module = Module.objects.get(module_name='Alunos')
        permission = Permissions.objects.get(teacher=teacher, module=student_module)
        if not permission.can_view:
            return Response({"message": "Sem permissão para para ver os Alunos"}, status=HTTP_401_UNAUTHORIZED)

    try:
        students = Student.objects.all()
        if not students.exists():
            return Response({"message": "Nenhum aluno encontrado"},status=status.HTTP_204_NO_CONTENT)

        data = []

        for s in students:
            if s.active:
                data.append({
                    "pfp": s.user.photo.url if s.user.photo else None,
                    "student_number": s.student_number,
                    "name": s.student_name,
                    "email": s.user.email,
                    "course": s.student_course.course_name,
                    "course_acronym": ''.join(word[0] for word in s.student_course.course_name.split() if word[0].isupper()),
                    "branch": {
                        "name": s.student_branch.branch_name if s.student_branch else None,
                        "acronym": s.student_branch.branch_acronym if s.student_branch else None,
                        "color": s.student_branch.color if s.student_branch else None
                    },
                })

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"message": "Erro interno do servidor", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
def createStudent(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para criar um Aluno"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        student_module = Module.objects.get(module_name='Alunos')
        permission = Permissions.objects.get(teacher=teacher, module=student_module)
        if not permission.can_edit:
            return Response({"message": "Sem permissão para criar um Aluno"}, status=HTTP_401_UNAUTHORIZED)

    try:
        data = request.data.copy()

        course = None
        try:
            course = Course.objects.get(id_course=data.get("student_course"))
        except Course.DoesNotExist:
            return Response({"message": "Curso não encontrado."}, status=status.HTTP_400_BAD_REQUEST)

        branch = None
        branch_id = data.get("student_branch")
        if branch_id:
            try:
                branch = Branch.objects.get(id_branch=branch_id)
            except Branch.DoesNotExist:
                return Response({"message": "Ramo não encontrado."}, status=status.HTTP_400_BAD_REQUEST)

        if Accounts.objects.filter(email=data.get("email")).exists():
            return Response({"message": "Email já registado."}, status=status.HTTP_400_BAD_REQUEST)

        if Student.objects.filter(student_number=data.get("student_number")).exists():
            return Response({"message": "Número de aluno já registado."}, status=status.HTTP_400_BAD_REQUEST)

        if Student.objects.filter(nif=data.get("nif")).exists():
            return Response({"message": "NIF já registado."}, status=status.HTTP_400_BAD_REQUEST)

        if Student.objects.filter(ident_doc=data.get("ident_doc")).exists():
            return Response({"message": "Documento de identificação já registado."}, status=status.HTTP_400_BAD_REQUEST)

        settings = Settings.objects.first()
        password = settings.student_password
        if data.get("password"):
            password = data.get("password")

        user = Accounts.objects.create_user(
            username=data["email"],
            email=data["email"],
            user_type="student",
        )
        user.set_password(password)
        user.save()

        student = Student.objects.create(
            user=user,
            student_number=data.get("student_number"),
            student_name=data.get("student_name"),
            nationality=data.get("nationality"),
            ident_type=data.get("ident_type"),
            ident_doc=data.get("ident_doc"),
            nif=data.get("nif"),
            gender=data.get("gender"),
            address=data.get("address"),
            contact=data.get("contact"),
            current_year=data.get("year"),
            average=data.get("average"),
            subjects_done=data.get("subjects_done"),
            student_course=course,
            student_branch=branch,
            student_ects=data.get("student_ects"),
        )

        for subj in data.pop('subjects', []):
            student.add_subject(subj['subject_name'], subj.get('state', Subject.PENDING))

        return Response({"message": "Aluno criado com sucesso"}, status=status.HTTP_201_CREATED)

    except Exception as e:
        traceback.print_exc()
        return Response({"message": "Internal server error",}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
def editStudent(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)
    has_permission = False

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type == "student":
        student = Student.objects.get(pk=pk)
        self = Student.objects.get(email=user_email)
        if student != self:
            return Response({"error":"Sem permissão para para editar o Aluno"}, status=status.HTTP_403_FORBIDDEN)

    elif user_type not in ["admin", "teacher"]:
        return Response({"detail": "login"}, status=HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        student_module = Module.objects.get(module_name='Alunos')
        permission = Permissions.objects.get(teacher=teacher, module=student_module)
        has_permission = True
        if not permission.can_edit:
            return Response({"detail": "Sem permissão para para editar o Aluno"}, status=HTTP_401_UNAUTHORIZED)


    try:
        data = request.data
        student = Student.objects.get(student_number=pk)
        course = Course.objects.get(id_course=data.get("student_course"))
        branch = Branch.objects.get(id_branch=data.get("student_branch")) if data.get("student_branch") else None
        calendar = Calendar.objects.get(id_calendar=data.get("student_calendar"))

        if Accounts.objects.filter(email=data["email"]).exclude(pk=student.user.pk).exists():
            return Response({"message": "Este email já está em uso"}, status=status.HTTP_400_BAD_REQUEST)

        if "student_number" in data and int(data["student_number"]) != student.student_number:
            if Student.objects.filter(student_number=data["student_number"]).exists():
                return Response({"message": "Este número de aluno já está em uso"}, status=status.HTTP_400_BAD_REQUEST)
            student.student_number = int(data["student_number"])


        if user_type == "admin" or (user_type == "teacher" and has_permission):
            student.active = data['active']

        student.user.email = data["email"]
        student.user.save()

        student.student_name = data.get("student_name", student.student_name)
        student.nationality = data.get("nationality", student.nationality)
        student.ident_type = data.get("ident_type", student.ident_type)
        student.ident_doc = data.get("ident_doc", student.ident_doc)
        student.nif = data.get("nif", student.nif)
        student.gender = data.get("gender", student.gender)
        student.address = data.get("address", student.address)
        student.contact = data.get("contact", student.contact)
        student.current_year = data.get("year", student.current_year)
        student.average = data.get("average", student.average)
        student.subjects_done = data.get("subjects_done", student.subjects_done)
        student.student_ects = data.get("student_ects", student.student_ects)
        student.student_course = course
        student.student_branch = branch
        student.calendar = calendar

        student.save()

        if "subjects" in data:
            student.subjects.all().delete()
            for subj in data["subjects"]:
                student.add_subject(subj["subject_name"], subj["state"])

        return Response({"message": "Aluno atualizado com sucesso"}, status=status.HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({"error": "Aluno não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Course.DoesNotExist:
        return Response({"message": "Curso não foi encontrado."}, status=HTTP_404_NOT_FOUND)
    except Branch.DoesNotExist:
        return Response({"message": "Ramo não foi encontrado."}, status=HTTP_404_NOT_FOUND)
    except Calendar.DoesNotExist:
        return Response({"message": "Calendário não foi encontrado."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
def deleteStudent(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=HTTP_400_BAD_REQUEST)

    elif user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para para eliminar o Aluno"}, status=status.HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        student_module = Module.objects.get(module_name='Alunos')
        permission = Permissions.objects.get(teacher=teacher, module=student_module)
        if not permission.can_delete:
            return Response({"detail": "Sem permissão para para eliminar o Aluno"}, status=HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(pk=pk)
        student.active = False
        student.save()
        return Response({"message": "Aluno eliminado com sucesso"}, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({"message": "Aluno não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
def addFavorite(request, proposal_id):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type != "student":
        return Response({"message": "Sem permissão para para adicionar aos favoritos"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(user__email=user_email)
        proposal = Proposal.objects.get(id_proposal=proposal_id)

        if proposal.calendar != student.calendar:
            return Response({"message": "Não pertence ao Calendário"}, status=HTTP_401_UNAUTHORIZED)

        if proposal.calendar.divulgation > date.today():
            return Response({"message": "Ainda não é possível guardar as Propostas"}, status=HTTP_403_FORBIDDEN)

        student.add_favorite(proposal_id)

        return Response({"message": "Proposal saved"}, status=status.HTTP_200_OK)
    except Proposal.DoesNotExist:
        return Response({"message": "Proposal not found"}, status=status.HTTP_404_NOT_FOUND)
    except Student.DoesNotExist:
        return Response({"message": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
def removeFavorite(request, proposal_id):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type != "student":
        return Response({"message": "Sem permissão para para remover dos favoritos"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(user__email=user_email)
        proposal = Proposal.objects.get(id_proposal=proposal_id)

        if proposal.calendar != student.calendar:
            return Response({"message": "Não pertence ao Calendário"}, status=HTTP_401_UNAUTHORIZED)

        if proposal.calendar.divulgation > date.today():
            return Response({"message": "Ainda não é possível guardar as Propostas"}, status=HTTP_403_FORBIDDEN)

        student.remove_favorite(proposal_id)

        return Response({"detail": "Proposal removed"}, status=status.HTTP_200_OK)
    except Proposal.DoesNotExist:
        return Response({"message": "Proposal not found"}, status=status.HTTP_404_NOT_FOUND)
    except Student.DoesNotExist:
        return Response({"message": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
