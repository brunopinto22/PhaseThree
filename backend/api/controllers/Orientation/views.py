from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.status import *

from api.models import (
    Student, Proposal, Teacher, Representative, Calendar,
    Module, Permissions, Candidature, CandidatureProposal
)
from api.token_manager import decode_token
from api.tasks.orientation import handle_orientation


@api_view(["GET"])
def getMyStudents(request):
    """
    REQ-14: Get students supervised by the logged-in teacher or representative.
    For teachers: Returns students assigned to proposals where they are isec_advisor.
    For representatives: Returns students assigned to their company's proposals.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    if user_type not in ["teacher", "representative"]:
        return Response({"message": "Apenas docentes e representantes podem aceder"}, status=HTTP_403_FORBIDDEN)

    try:
        students_data = []

        if user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            
            # Get proposals where this teacher is ISEC advisor
            proposals = Proposal.objects.filter(isec_advisor=teacher)
            
            for proposal in proposals:
                # Get students placed in this proposal
                for student in proposal.students.all():
                    # Get candidature info
                    candidature = Candidature.objects.filter(student=student).first()
                    
                    students_data.append({
                        "student": {
                            "number": student.student_number,
                            "name": student.student_name,
                            "email": student.user.email,
                            "course": student.student_course.course_name,
                            "average": student.average,
                            "curriculum": student.curriculum.url if student.curriculum else None,
                        },
                        "proposal": {
                            "id": proposal.id_proposal,
                            "number": proposal.calendar_proposal_number,
                            "title": proposal.proposal_title,
                            "company": proposal.company.company_name if proposal.company else "ISEC",
                            "calendar": str(proposal.calendar),
                        },
                        "candidature_state": candidature.state if candidature else None,
                        "role": "isec_advisor"
                    })

        elif user_type == "representative":
            representative = Representative.objects.get(user__email=user_email)
            
            # Get proposals from this representative's company
            proposals = Proposal.objects.filter(company=representative.company)
            
            for proposal in proposals:
                for student in proposal.students.all():
                    candidature = Candidature.objects.filter(student=student).first()
                    
                    students_data.append({
                        "student": {
                            "number": student.student_number,
                            "name": student.student_name,
                            "email": student.user.email,
                            "course": student.student_course.course_name,
                            "average": student.average,
                            "curriculum": student.curriculum.url if student.curriculum else None,
                        },
                        "proposal": {
                            "id": proposal.id_proposal,
                            "number": proposal.calendar_proposal_number,
                            "title": proposal.proposal_title,
                            "isec_advisor": {
                                "name": proposal.isec_advisor.teacher_name,
                                "email": proposal.isec_advisor.user.email
                            } if proposal.isec_advisor else None,
                            "calendar": str(proposal.calendar),
                        },
                        "candidature_state": candidature.state if candidature else None,
                        "role": "company_advisor"
                    })

        if not students_data:
            return Response({"message": "Não tem alunos atribuídos"}, status=HTTP_204_NO_CONTENT)

        return Response(students_data, status=HTTP_200_OK)

    except Teacher.DoesNotExist:
        return Response({"message": "Docente não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Representative.DoesNotExist:
        return Response({"message": "Representante não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
def reassignAdvisor(request, pk):
    """
    REQ-14: Reassign ISEC advisor for a proposal.
    Only admin or course commission members can do this.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    try:
        proposal = Proposal.objects.get(id_proposal=pk)
        
        # Check permissions
        if user_type == "admin":
            pass  # Admin can always reassign
        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            # Must be in commission for this course
            if not proposal.course.commission.filter(id_teacher=teacher.id_teacher).exists():
                return Response({"message": "Apenas membros da comissão podem reatribuir orientadores"}, status=HTTP_403_FORBIDDEN)
        else:
            return Response({"message": "Sem permissão para reatribuir orientadores"}, status=HTTP_403_FORBIDDEN)

        # Get new advisor
        new_advisor_id = request.data.get("advisor_id")
        if not new_advisor_id:
            return Response({"message": "ID do orientador é obrigatório"}, status=HTTP_400_BAD_REQUEST)

        try:
            new_advisor = Teacher.objects.get(id_teacher=new_advisor_id)
        except Teacher.DoesNotExist:
            return Response({"message": "Docente não encontrado"}, status=HTTP_404_NOT_FOUND)

        # Verify teacher is from same scientific area
        if new_advisor.scientific_area != proposal.course.scientific_area:
            return Response({
                "message": "O docente deve pertencer à mesma área científica do curso"
            }, status=HTTP_400_BAD_REQUEST)

        old_advisor = proposal.isec_advisor
        proposal.isec_advisor = new_advisor
        proposal.save()

        return Response({
            "message": "Orientador reatribuído com sucesso",
            "old_advisor": old_advisor.teacher_name if old_advisor else None,
            "new_advisor": new_advisor.teacher_name
        }, status=HTTP_200_OK)

    except Proposal.DoesNotExist:
        return Response({"message": "Proposta não encontrada"}, status=HTTP_404_NOT_FOUND)
    except Teacher.DoesNotExist:
        return Response({"message": "Docente não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def getCalendarOrientations(request, pk):
    """
    REQ-14: Get all proposals with advisor assignments for a calendar.
    Accessible by admin, commission members, and teachers with permissions.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    try:
        calendar = Calendar.objects.get(id_calendar=pk)
        can_reassign = False

        # Check permissions
        if user_type == "admin":
            can_reassign = True
        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            # Can view if in commission or has permission
            if calendar.course.commission.filter(id_teacher=teacher.id_teacher).exists():
                can_reassign = True
            else:
                module = Module.objects.filter(module_name='Propostas').first()
                if module:
                    permission = Permissions.objects.filter(teacher=teacher, module=module).first()
                    if not permission or not permission.can_view:
                        return Response({"message": "Sem permissão para ver orientações"}, status=HTTP_403_FORBIDDEN)
        else:
            return Response({"message": "Sem permissão para ver orientações"}, status=HTTP_403_FORBIDDEN)

        # Get all proposals for this calendar
        proposals = Proposal.objects.filter(calendar=calendar).select_related(
            'company', 'isec_advisor', 'company_advisor'
        )

        # Get available teachers for reassignment
        available_teachers = []
        if can_reassign:
            teachers = Teacher.objects.filter(
                scientific_area=calendar.course.scientific_area,
                active=True
            )
            available_teachers = [
                {"id": t.id_teacher, "name": t.teacher_name}
                for t in teachers
            ]

        data = []
        for p in proposals:
            students_placed = []
            for student in p.students.all():
                candidature = Candidature.objects.filter(student=student).first()
                students_placed.append({
                    "number": student.student_number,
                    "name": student.student_name,
                    "email": student.user.email,
                    "state": candidature.state if candidature else None
                })

            data.append({
                "id": p.id_proposal,
                "number": p.calendar_proposal_number,
                "title": p.proposal_title,
                "company": {
                    "id": p.company.id_company,
                    "name": p.company.company_name
                } if p.company else None,
                "isec_advisor": {
                    "id": p.isec_advisor.id_teacher,
                    "name": p.isec_advisor.teacher_name,
                    "email": p.isec_advisor.user.email
                } if p.isec_advisor else None,
                "company_advisor": {
                    "id": p.company_advisor.id_representative,
                    "name": p.company_advisor.representative_name
                } if p.company_advisor else None,
                "slots": p.slots,
                "students_placed": students_placed,
                "needs_advisor": p.company is not None and p.isec_advisor is None
            })

        return Response({
            "calendar": {
                "id": calendar.id_calendar,
                "title": str(calendar),
                "course": calendar.course.course_name
            },
            "proposals": data,
            "can_reassign": can_reassign,
            "available_teachers": available_teachers
        }, status=HTTP_200_OK)

    except Calendar.DoesNotExist:
        return Response({"message": "Calendário não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def triggerOrientationAssignment(request, pk):
    """
    REQ-14: Manually trigger the orientation assignment for a calendar.
    Only admin or commission members can do this.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_401_UNAUTHORIZED)

    try:
        calendar = Calendar.objects.get(id_calendar=pk)

        # Check permissions
        if user_type == "admin":
            pass
        elif user_type == "teacher":
            teacher = Teacher.objects.get(user__email=user_email)
            if not calendar.course.commission.filter(id_teacher=teacher.id_teacher).exists():
                return Response({"message": "Apenas admin ou comissão podem executar atribuições"}, status=HTTP_403_FORBIDDEN)
        else:
            return Response({"message": "Sem permissão"}, status=HTTP_403_FORBIDDEN)

        # Run the orientation assignment
        result = handle_orientation(pk)

        if "error" in result:
            return Response(result, status=HTTP_400_BAD_REQUEST)

        return Response(result, status=HTTP_200_OK)

    except Calendar.DoesNotExist:
        return Response({"message": "Calendário não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": "Erro interno do servidor", "details": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)

