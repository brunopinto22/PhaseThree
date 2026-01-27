import json
import os
import traceback
from datetime import datetime as dt

from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from rest_framework.status import *
from django.http import JsonResponse

from .models import *
from .permissions import *
from .token_manager import *
from django.db import transaction

"""
TOKEN
"""
@api_view(["GET"])
def test_token(request):
    token = request.headers.get("Authorization")

    res = verify_token(token)

    if res is None:
        return Response(status=status.HTTP_401_UNAUTHORIZED)
    else:
        return Response(status=status.HTTP_200_OK)


"""
SCIENTIFICAREA
"""
@api_view(["GET"])
def listScientificAreas(request):
    areas = ScientificArea.objects.all()

    data = [
        {
            "id": a.id_area,
            "name": a.area_name,
            "n_courses": Course.objects.filter(scientific_area=a).count(),
            "n_teachers": Teacher.objects.filter(scientific_area=a).count(),
        }
        for a in areas
    ]

    return JsonResponse(data, status=200, safe=False)

@api_view(["POST"])
def addArea(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=status.HTTP_400_BAD_REQUEST)

    if user_type != "admin":
        return Response({"detail": "permission"}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    name = data.get("name")
    if name:
        if ScientificArea.objects.filter(area_name=name).exists():
            return Response(
                {"message": "ScientificArea already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        ScientificArea.objects.create(area_name=name)
        return Response(
            {"message": "ScientificArea added successfully"},
            status=status.HTTP_201_CREATED
        )
    return Response(status=status.HTTP_400_BAD_REQUEST)

@api_view(["PATCH"])
def editArea(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=status.HTTP_400_BAD_REQUEST)

    if user_type != "admin":
        return Response({"detail": "permission"}, status=status.HTTP_403_FORBIDDEN)

    area = ScientificArea.objects.get(pk=pk)

    new_name = request.data.get("name")
    if not new_name:
        return Response({"message": "name is required"}, status=status.HTTP_400_BAD_REQUEST)

    area.area_name = new_name
    area.save()

    return Response(
        {"message": "ScientificArea updated successfully"},
        status=status.HTTP_200_OK
    )

@api_view(["DELETE"])
def deleteArea(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if (
            user_email == "Expired Token."
            or user_email == "Invalid Token"
            or user_email == "Payload does not contain 'user_id'."
    ):
        return Response({"detail": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type != "admin":
        return Response({"detail": "permission"}, status=status.HTTP_403_FORBIDDEN)

    try:
        if not ScientificArea.objects.filter(id_area=pk).exists():
            return Response(
                {"message": f"ScientificArea with id={pk} not found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        ScientificArea.objects.filter(id_area=pk).delete()
        return Response({"message": "ScientificArea deleted successfully"}, status=status.HTTP_200_OK)

    except json.JSONDecodeError:
        return Response({"message": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)


"""
DATA EXPORT - GDPR RIGHT OF ACCESS
"""
@api_view(["GET"])
def export_user_data(request):
    """
    GDPR Compliance: Right of Access
    Exports all personal data of the authenticated user in JSON format.
    """
    try:
        # Verify user is authenticated
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return Response(
                {"message": "No authorization header"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id, user_email, user_type = decode_token(auth_header)
        
        if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
            return Response(
                {"message": "Invalid token"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get the user
        try:
            user = Accounts.objects.get(email=user_email)
        except Accounts.DoesNotExist:
            return Response(
                {"message": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Build basic data export
        export_data = {
            "export_date": dt.now().isoformat(),
            "account": {
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "user_type": user.user_type,
                "date_joined": user.date_joined.isoformat() if user.date_joined else None,
                "last_login": user.last_login.isoformat() if user.last_login else None,
            }
        }
        
        # Export Student data if user is a student
        try:
            student = Student.objects.get(user=user)
            export_data["student"] = {
                "student_number": student.student_number,
                "student_name": student.student_name,
                "nationality": student.nationality,
                "ident_type": student.ident_type,
                "ident_doc": student.ident_doc,
                "nif": student.nif,
                "gender": student.gender,
                "address": student.address,
                "contact": student.contact,
                "current_year": student.current_year,
                "average": student.average,
                "subjects_done": student.subjects_done,
                "student_course": student.student_course.course_name if student.student_course else None,
                "student_branch": student.student_branch.branch_name if student.student_branch else None,
                "student_ects": student.student_ects,
                "active": student.active,
            }
            
            # Add subjects
            subjects = Subject.objects.filter(student=student)
            export_data["student"]["subjects"] = [
                {
                    "subject_name": s.subject_name,
                    "state": s.state
                }
                for s in subjects
            ]
            
            # Add favorites
            favorites = Favorite.objects.filter(student=student)
            export_data["student"]["favorites"] = [
                {
                    "proposal_id": f.proposal.id_proposal,
                    "proposal_title": f.proposal.proposal_title
                }
                for f in favorites
            ]
            
            # Add candidatures
            candidatures = Candidature.objects.filter(student=student)
            candidatures_list = []
            for c in candidatures:
                cand = {
                    "id": c.id_candidature,
                    "state": c.state,
                    "submission_date": str(c.candidature_submission_date),
                    "proposals": []
                }
                try:
                    proposals_list = []
                    for cp in c.candidature_proposals.all():
                        proposals_list.append({
                            "proposal_title": cp.proposal.proposal_title,
                            "proposal_state": cp.state
                        })
                    cand["proposals"] = proposals_list
                except:
                    pass
                candidatures_list.append(cand)
            export_data["student"]["candidatures"] = candidatures_list
            
        except Student.DoesNotExist:
            pass
        except Exception as e:
            export_data["student_error"] = str(e)
        
        # Export Teacher data if user is a teacher
        try:
            teacher = Teacher.objects.get(user=user)
            export_data["teacher"] = {
                "id_teacher": teacher.id_teacher,
                "teacher_name": teacher.teacher_name,
                "teacher_category": teacher.teacher_category,
                "scientific_area": teacher.scientific_area.area_name if teacher.scientific_area else None,
                "active": teacher.active,
            }
            
            # Add permissions
            permissions = Permissions.objects.filter(teacher=teacher)
            export_data["teacher"]["permissions"] = [
                {
                    "module": p.module.module_name,
                    "can_view": p.can_view,
                    "can_edit": p.can_edit,
                    "can_delete": p.can_delete,
                }
                for p in permissions
            ]
            
        except Teacher.DoesNotExist:
            pass
        except Exception as e:
            export_data["teacher_error"] = str(e)
        
        # Export Representative data if user is a representative
        try:
            representative = Representative.objects.get(user=user)
            export_data["representative"] = {
                "id_representative": representative.id_representative,
                "representative_name": representative.representative_name,
                "representative_role": representative.representative_role,
                "representative_contact": representative.representative_contact,
                "company": representative.company.company_name if representative.company else None,
                "active": representative.active,
            }
        except Representative.DoesNotExist:
            pass
        except Exception as e:
            export_data["representative_error"] = str(e)
        
        return Response(export_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in export_user_data: {str(e)}")
        print(error_trace)
        return Response(
            {
                "message": f"Error exporting data: {str(e)}", 
                "trace": error_trace
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


