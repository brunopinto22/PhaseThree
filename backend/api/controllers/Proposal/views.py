import os
import re
import tempfile
import traceback
from copy import copy
from io import BytesIO

import unicodedata
from django.core.mail import send_mail
from django.db.models import F, Value, IntegerField, Case, When
from django.http import FileResponse, JsonResponse
from django.utils import timezone
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
from rest_framework.response import Response
from rest_framework import status
from rest_framework.status import *
from rest_framework.decorators import api_view
from docxtpl import DocxTemplate
from docx2pdf import convert

from api.models import *
from api.token_manager import *
from datetime import date



@api_view(["GET"])
def getProposal(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)
    can_edit = False

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        p = Proposal.objects.get(id_proposal=pk)

        if user_type == "admin":
            can_edit = True

        elif user_type == "student":
            student = Student.objects.get(user__email=user_email)
            calendar = p.calendar

            if calendar != student.calendar :
                return Response({"message":"Não pertence ao Calendário"}, status=HTTP_401_UNAUTHORIZED)

            if calendar.divulgation > date.today():
                return Response({"message":"Ainda não é possível ver as Propostas"}, status=HTTP_403_FORBIDDEN)

        elif user_type == "representative":
            representative = Representative.objects.get(user__email=user_email)
            if p.company != representative.company:
                return Response({"message":"A Proposta não pertence à sua Empresa"}, status=HTTP_401_UNAUTHORIZED)
            can_edit = representative.company.company_admin == representative or p.company_advisor == representative

        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)

            can_edit = p.isec_advisor is not None and p.isec_advisor == teacher and p.proposal_type == 2

            module = Module.objects.get(module_name='Propostas')
            permission = Permissions.objects.get(teacher=teacher, module=module)
            if not (permission.can_view or teacher.scientific_area == p.calendar.course.scientific_area or p.isec_advisor == teacher):
                return Response({"message":f"Não tem permissão para ver esta proposta"}, status=HTTP_403_FORBIDDEN)
            can_edit = permission.can_edit or can_edit

        data = {
            "favourite": Student.objects.get(user__email=user_email).get_favorites().filter(proposal_id=pk).exists() if user_type == "student" else False,
            "proposal_number": p.calendar_proposal_number,
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
            "can_edit": p.calendar.divulgation > date.today() and can_edit,
            "students": [
                {
                    "number": s.student_number,
                    "pfp": request.build_absolute_uri(s.user.photo.url) if s.user.photo else None,
                    "name": s.student_name,
                    "email": s.user.email,
                } for s in p.students.all()
            ]
        }

        return JsonResponse(data, status=status.HTTP_200_OK)

    except (Student.DoesNotExist, Representative.DoesNotExist, Teacher.DoesNotExist):
        return Response({"message": "O Utlizador não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Proposal.DoesNotExist:
        return Response({"message": "A Proposta não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({ "error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["GET"])
def listProposals(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    can_edit = False
    can_delete = False

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        rep = None
        proposals = Proposal.objects.all()
        favorite_ids = set()

        if user_type == "admin":
            can_edit = can_delete = True

        elif user_type == "student":
            student = Student.objects.get(user__email=user_email)
            proposals = proposals.filter(calendar=student.calendar, calendar__divulgation__lte=date.today())
            favorite_ids = set(student.get_favorites().values_list("proposal_id", flat=True))

        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            module = Module.objects.get(module_name='Propostas')
            permission = Permissions.objects.get(teacher=teacher, module=module)
            self_filter = request.query_params.get("self", "false").lower() == "true"

            if self_filter:
                proposals = proposals.filter(isec_advisor=teacher, company__isnull=True)
            elif not permission.can_view:
                proposals = proposals.filter(isec_advisor=teacher)

            can_edit = permission.can_edit
            can_delete = permission.can_delete

        elif user_type == "representative":
            rep = Representative.objects.get(user__email=user_email)
            proposals = proposals.filter(company=rep.company)

            can_edit = rep.company.company_admin == rep
            can_delete = rep.company.company_admin == rep

        data = [
            {
                "favourite": p.id_proposal in favorite_ids,
                "id": p.id_proposal,
                "proposal_number": p.calendar_proposal_number,
                "type": p.proposal_type,
                "title": p.proposal_title,
                "company": {
                    "id": p.company.id_company if p.company else None,
                    "name": p.company.company_name if p.company else "ISEC",
                },
                "location": p.location,
                "can_edit": p.calendar.divulgation > date.today() and (can_edit or (rep is not None and p.company_advisor == rep.company)),
                "can_delete": p.calendar.divulgation > date.today() and can_delete,
                "calendar": {
                    "id": p.calendar.id_calendar,
                    "title": p.calendar.__str__(),
                    "submission_start": p.calendar.submission_start.strftime("%d/%m/%Y"),
                    "submission_end": p.calendar.submission_end.strftime("%d/%m/%Y"),
                    "divulgation": p.calendar.divulgation.strftime("%d/%m/%Y"),
                    "candidatures": p.calendar.candidatures.strftime("%d/%m/%Y"),
                    "placements": p.calendar.placements.strftime("%d/%m/%Y"),
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

        if data.__len__() == 0:
            return Response({"message": "Nenhuma Proposta encontrada"}, status=status.HTTP_204_NO_CONTENT)

        return Response(data, status=status.HTTP_200_OK)

    except (Student.DoesNotExist, Representative.DoesNotExist, Teacher.DoesNotExist):
        return Response({"message": "O Utlizador não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

            sett = Settings.objects.first()

            user = Accounts.objects.create(
                username = email,
                email = email,
                user_type = 'representative'
            )
            user.set_password(sett.representative_password)
            user.save()

            advisor = Representative.objects.create(
                user = user,
                representative_name=name,
                company=company,
            )

            msg = (
                f"Foi registado como Orientador de Estágio pela empresa {company.company_name}.\n\n"
                f"O endereço de email de registo corresponde a este onde recebeu a presente notificação. "
                f"A palavra-passe atribuída à conta é '{sett.representative_password}'. "
                f"Recomendamos que a altere o mais brevemente possível."
            )

            send_mail(
                subject="Registo como Orientador",
                message=msg,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
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

        return Response({"message": "Proposta criada com sucesso.", "id":proposal.id_proposal}, status=HTTP_201_CREATED)

    except Course.DoesNotExist:
        return Response({"message": "Curso não encontrado."}, status=HTTP_404_NOT_FOUND)
    except Company.DoesNotExist:
        return Response({"message": "Empresa não encontrada."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

    elif user_type not in ["admin", "teacher", "representative"]:
        return Response({"message": "Sem permissão para editar a Proposta"}, status=HTTP_401_UNAUTHORIZED)

    try:
        proposal = Proposal.objects.get(id_proposal=pk)
        data = request.data

        if proposal.calendar.divulgation <= date.today():
            return Response({"message": "Não tem permissão para editar esta proposta"}, status=HTTP_403_FORBIDDEN)

        proposal.proposal_title = data.get("title")
        proposal.proposal_description = data.get("description")
        proposal.proposal_selection_method = data.get("selection")
        proposal.proposal_conditions = data.get("conditions")
        proposal.proposal_scheduling = data.get("scheduling")
        proposal.proposal_technologies = data.get("technologies")
        proposal.proposal_methodologies = data.get("methodologies")
        proposal.proposal_objectives = data.get("objectives")
        proposal.proposal_type = data.get("proposal_type")
        proposal.course = Course.objects.get(id_course=data.get("course_id"))
        proposal.work_format = data.get("work_format")
        proposal.location = data.get("location")
        proposal.schedule = data.get("schedule")

        if "branches" in data:
            branches = Branch.objects.filter(id_branch__in=data.get("branches", []))
            proposal.branches.set(branches)

        proposal.save()

        return Response({"message": "Proposta editada com sucesso"}, status=status.HTTP_200_OK)

    except Proposal.DoesNotExist:
        return Response({"message": "Proposta não encontrada."}, status=HTTP_404_NOT_FOUND)
    except Course.DoesNotExist:
        return Response({"message": "Curso não encontrado."}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


@api_view(["GET"])
def generatePdf(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        p = Proposal.objects.get(id_proposal=pk)
    except Proposal.DoesNotExist:
        return Response({"message": "A Proposta não foi encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if user_type == "student":
        student = Student.objects.get(user__email=user_email)
        calendar = p.calendar

        if calendar != student.calendar:
            return Response({"message": "Não pertence ao Calendário"}, status=HTTP_401_UNAUTHORIZED)

        if calendar.divulgation > date.today():
            return Response({"message": "Ainda não é possível ver as Propostas"}, status=HTTP_403_FORBIDDEN)

    elif user_type == "representative":
        representative = Representative.objects.get(user__email=user_email)
        if p.company != representative.company:
            return Response({"message": "A Proposta não pertence à sua Empresa"}, status=HTTP_401_UNAUTHORIZED)

    elif user_type == "teacher":
        teacher = Teacher.objects.get(user__email=user_email)
        module = Module.objects.get(module_name='Propostas')
        permission = Permissions.objects.get(teacher=teacher, module=module)
        if not permission.can_view or teacher.scientific_area != p.calendar.course.scientific_area:
            return Response({"message": "Não tem permissão para visualizar esta proposta"}, status=HTTP_403_FORBIDDEN)


    try:
        # Generate Document
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        template_path = os.path.join(BASE_DIR, "templates", "docs", "proposal_template.docx")
        template_path = os.path.abspath(template_path)
        doc = DocxTemplate(template_path)

        # Populate Template
        context = {
            "type": "Estágio" if p.proposal_type == 1 else "Projeto",
            "course": p.course.course_name,
            "year": f"{p.calendar.calendar_year}/{p.calendar.calendar_year + 1}",
            "semester": p.calendar.calendar_semester,
            "title": p.proposal_title,
            "description": p.proposal_description,
            "branches": [{"name": b.branch_name} for b in p.branches.all()],
            "objectives": p.proposal_objectives,
            "selection_method": p.proposal_selection_method,
            "conditions": p.proposal_conditions,
            "scheduling": p.proposal_scheduling,
            "technologies": p.proposal_technologies,
            "methodologies": p.proposal_methodologies,
            "format": dict(p.WORK_FORMATS).get(p.work_format, p.work_format),
            "location": p.location,
            "schedule": p.schedule,
            "slots": p.slots,
            "company": {
                "name": p.company.company_name,
                "address": p.company.company_address,
                "nif": p.company.company_nipc,
            } if p.company else None,
            "company_advisor": {
                "name": p.company_advisor.representative_name,
                "email": p.company_advisor.user.email
            } if p.company_advisor else None,
            "isec_advisor": {
                "name": p.isec_advisor.teacher_name,
                "email": p.isec_advisor.user.email
            } if p.isec_advisor else None,
        }
        doc.render(context)

        # Create temp files
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp_docx:
            doc.save(tmp_docx.name)
            tmp_docx_path = tmp_docx.name

        tmp_pdf_fd, tmp_pdf_path = tempfile.mkstemp(suffix=".pdf")
        os.close(tmp_pdf_fd)

        # Convert to PDF
        convert(tmp_docx_path, tmp_pdf_path)
        with open(tmp_pdf_path, "rb") as f:
            pdf_bytes = f.read()

        # Clean temp files
        os.remove(tmp_docx_path)
        os.remove(tmp_pdf_path)

        raw_filename = f"{p.calendar.calendar_year}-P{p.id_proposal}-{p.calendar.calendar_semester}S-{p.proposal_title}"

        normalized = unicodedata.normalize('NFKD', raw_filename).encode('ASCII', 'ignore').decode('ASCII')
        safe_filename = re.sub(r'[\\/*?:"<>|]', "_", normalized) + ".pdf"

        response = FileResponse(BytesIO(pdf_bytes), as_attachment=True, filename=safe_filename,
                                content_type="application/pdf")
        response['Access-Control-Expose-Headers'] = 'Content-Disposition, X-Filename'
        return response

    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def getProposalCandidates(request, proposal_id):
    """
    Endpoint para representative ver candidatos de uma proposta.
    Retorna lista de alunos que se candidataram com seus dados.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
        user_email == "Expired Token."
        or user_email == "Invalid Token"
        or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type != "representative":
        return Response({"message": "Sem permissão"}, status=HTTP_403_FORBIDDEN)

    try:
        representative = Representative.objects.get(user__email=user_email)
        proposal = Proposal.objects.get(id_proposal=proposal_id)

        # Validar que representative é company_advisor da proposta
        if proposal.company_advisor != representative:
            return Response(
                {"message": "Apenas o company advisor pode ver candidatos desta proposta"},
                status=HTTP_403_FORBIDDEN
            )

        # NOVO SISTEMA: Buscar apenas candidatos COLOCADOS ou ACEITOS nesta proposta
        candidature_proposals = CandidatureProposal.objects.filter(
            proposal=proposal,
            state__in=['placed', 'accepted']  # Apenas colocados ou aceitos
        ).select_related(
            'candidature', 
            'candidature__student',
            'candidature__student__user',
            'candidature__student__student_course',
            'candidature__student__student_branch'
        ).order_by('-candidature__student__average', 'candidature__candidature_submission_date')

        # Contar candidatos aceites e colocados
        accepted_count = candidature_proposals.filter(state='accepted').count()
        placed_count = candidature_proposals.filter(state='placed').count()

        # Montar lista de candidatos
        candidates = []
        for cp in candidature_proposals:
            student = cp.candidature.student
            candidates.append({
                "student_number": student.student_number,
                "student_name": student.student_name,
                "student_email": student.user.email,
                "student_average": student.average,  # NOVO: Incluir média
                "course": student.student_course.course_name if student.student_course else None,
                "branch": student.student_branch.branch_name if student.student_branch else None,
                "curriculum_url": request.build_absolute_uri(student.curriculum.url) if student.curriculum else None,
                "submission_date": cp.candidature.candidature_submission_date.strftime("%d/%m/%Y"),
                "priority": cp.priority,  # NOVO: Incluir prioridade da proposta para o aluno
                "state": cp.state,
                "can_change": cp.state == 'placed'  # Só pode mudar se ainda estiver 'placed'
            })

        data = {
            "proposal_id": proposal.id_proposal,
            "proposal_title": proposal.proposal_title,
            "slots": proposal.slots,
            "accepted_count": accepted_count,
            "placed_count": placed_count,  # NOVO
            "calendar": {
                "title": proposal.calendar.__str__(),
                "submission_start": proposal.calendar.submission_start.strftime("%d/%m/%Y"),
                "submission_end": proposal.calendar.submission_end.strftime("%d/%m/%Y"),
                "divulgation": proposal.calendar.divulgation.strftime("%d/%m/%Y"),
                "candidatures": proposal.calendar.candidatures.strftime("%d/%m/%Y"),
                "placements": proposal.calendar.placements.strftime("%d/%m/%Y"),
            },
            "candidates": candidates
        }

        return JsonResponse(data, status=status.HTTP_200_OK)

    except Representative.DoesNotExist:
        return Response({"message": "Representative não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Proposal.DoesNotExist:
        return Response({"message": "Proposta não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["PUT"])
def acceptCandidate(request, proposal_id, student_number):
    """
    Endpoint para representative aceitar um candidato COLOCADO.
    Novo sistema: empresa só pode aceitar/rejeitar candidatos já colocados pelo sistema.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
        user_email == "Expired Token."
        or user_email == "Invalid Token"
        or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type != "representative":
        return Response({"message": "Sem permissão"}, status=HTTP_403_FORBIDDEN)

    try:
        representative = Representative.objects.get(user__email=user_email)
        proposal = Proposal.objects.get(id_proposal=proposal_id)
        student = Student.objects.get(student_number=student_number)

        # Validar que representative é company_advisor
        if proposal.company_advisor != representative:
            return Response(
                {"message": "Apenas o company advisor pode aceitar candidatos"},
                status=HTTP_403_FORBIDDEN
            )

        # Buscar candidatura do aluno
        candidature = Candidature.objects.get(student=student)
        
        # Buscar CandidatureProposal
        candidature_proposal = CandidatureProposal.objects.get(
            candidature=candidature,
            proposal=proposal
        )

        # VALIDAR: Candidato deve estar 'placed' nesta proposta
        if candidature_proposal.state != 'placed':
            return Response(
                {"message": "Candidato não está colocado nesta proposta"},
                status=HTTP_400_BAD_REQUEST
            )

        # ACEITAR CANDIDATO
        candidature_proposal.state = 'accepted'
        candidature_proposal.state_changed_at = timezone.now()
        candidature_proposal.save()

        # Atualizar estado da candidatura
        candidature.state = 'accepted'
        candidature.save()

        # Registrar no histórico
        candidature.change_state(
            new_state='accepted',
            changed_by=representative.user,
            notes=f'Aceito pela empresa {proposal.company.company_name}'
        )

        # Marcar todas as outras propostas como 'skipped'
        CandidatureProposal.objects.filter(
            candidature=candidature
        ).exclude(id=candidature_proposal.id).update(
            state='skipped',
            state_changed_at=timezone.now()
        )

        # Adicionar student à proposta
        proposal.students.add(student)

        return Response(
            {"message": "Candidato aceite com sucesso"},
            status=HTTP_200_OK
        )

    except Representative.DoesNotExist:
        return Response({"message": "Representative não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Proposal.DoesNotExist:
        return Response({"message": "Proposta não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except CandidatureProposal.DoesNotExist:
        return Response({"message": "Aluno não se candidatou a esta proposta"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["PUT"])
def rejectCandidate(request, proposal_id, student_number):
    """
    Endpoint para representative rejeitar um candidato COLOCADO.
    Novo sistema: após rejeição, tenta recolocar na próxima proposta da lista.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
        user_email == "Expired Token."
        or user_email == "Invalid Token"
        or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type != "representative":
        return Response({"message": "Sem permissão"}, status=HTTP_403_FORBIDDEN)

    try:
        representative = Representative.objects.get(user__email=user_email)
        proposal = Proposal.objects.get(id_proposal=proposal_id)
        student = Student.objects.get(student_number=student_number)

        # Validar que representative é company_advisor
        if proposal.company_advisor != representative:
            return Response(
                {"message": "Apenas o company advisor pode rejeitar candidatos"},
                status=HTTP_403_FORBIDDEN
            )

        # Buscar candidatura do aluno
        candidature = Candidature.objects.get(student=student)
        
        # Buscar CandidatureProposal
        candidature_proposal = CandidatureProposal.objects.get(
            candidature=candidature,
            proposal=proposal
        )

        # VALIDAR: Candidato deve estar 'placed' nesta proposta
        if candidature_proposal.state != 'placed':
            return Response(
                {"message": "Candidato não está colocado nesta proposta"},
                status=HTTP_400_BAD_REQUEST
            )

        # REJEITAR nesta proposta
        candidature_proposal.state = 'rejected'
        candidature_proposal.state_changed_at = timezone.now()
        candidature_proposal.save()

        # TENTAR RECOLOCAR na próxima proposta da lista
        next_proposals = CandidatureProposal.objects.filter(
            candidature=candidature,
            state='pending',
            priority__gt=candidature_proposal.priority
        ).select_related('proposal').order_by('priority')

        recolocado = False
        
        for next_prop in next_proposals:
            # Verificar vagas disponíveis
            slots_ocupados = CandidatureProposal.objects.filter(
                proposal=next_prop.proposal,
                state='placed'
            ).count()
            
            if next_prop.proposal.slots > slots_ocupados:
                # RECOLOCAR
                candidature.placed_proposal = next_prop.proposal
                candidature.placement_attempt += 1
                candidature.save()
                
                next_prop.state = 'placed'
                next_prop.state_changed_at = timezone.now()
                next_prop.save()
                
                # Registrar no histórico
                candidature.change_state(
                    new_state='placed',
                    changed_by=representative.user,
                    notes=f'Rejeitado em {proposal.proposal_title}, recolocado em {next_prop.proposal.proposal_title} (prioridade {next_prop.priority})'
                )
                
                recolocado = True
                break
        
        if not recolocado:
            # SEM MAIS OPÇÕES - marcar como rejected
            candidature.state = 'rejected'
            candidature.placed_proposal = None
            candidature.save()
            
            # Marcar todas as propostas restantes como rejected
            candidature.candidature_proposals.filter(
                state='pending'
            ).update(state='rejected', state_changed_at=timezone.now())
            
            # Registrar no histórico
            candidature.change_state(
                new_state='rejected',
                changed_by=representative.user,
                notes=f'Rejeitado em {proposal.proposal_title}. Sem vagas nas propostas restantes.'
            )

        message = "Candidato rejeitado"
        if recolocado:
            message += " e recolocado na próxima proposta da lista"
        else:
            message += ". Sem vagas nas propostas restantes."

        return Response(
            {"message": message, "recolocado": recolocado},
            status=HTTP_200_OK
        )

    except Representative.DoesNotExist:
        return Response({"message": "Representative não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Proposal.DoesNotExist:
        return Response({"message": "Proposta não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)
    except CandidatureProposal.DoesNotExist:
        return Response({"message": "Aluno não se candidatou a esta proposta"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": "Erro interno do servidor", "details": str(e)},
            status=HTTP_500_INTERNAL_SERVER_ERROR
        )
