from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.status import *
from django.utils import timezone
from api.models import Student, Accounts
from api.token_manager import decode_token

@api_view(["PUT"])
def validateStudent(request, pk):
    """
    Validate/approve or reject a student registration.
    Only admin/academic_services can perform this action.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # Only admin can validate students
    if user_type != "admin":
        return Response({"message": "Forbidden"}, status=HTTP_403_FORBIDDEN)

    try:
        student = Student.objects.get(student_number=pk)
        action = request.data.get("action")  # 'approve' or 'reject'
        rejection_reason = request.data.get("rejection_reason", "")

        if action not in ["approve", "reject"]:
            return Response({"message": "Invalid action. Use 'approve' or 'reject'."}, status=HTTP_400_BAD_REQUEST)

        if action == "reject" and not rejection_reason:
            return Response({"message": "Rejection reason is required when rejecting a student."}, status=HTTP_400_BAD_REQUEST)

        # Update validation status
        if action == "approve":
            student.validation_status = "approved"
            student.rejection_reason = None
        else:  # reject
            student.validation_status = "rejected"
            student.rejection_reason = rejection_reason

        # Set who validated and when
        validator = Accounts.objects.get(email=user_email)
        student.validated_by = validator
        student.validated_at = timezone.now()
        student.save()

        return Response({
            "message": f"Student {action}d successfully",
            "student_number": student.student_number,
            "validation_status": student.validation_status
        }, status=HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({"message": "Student not found"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def listPendingStudents(request):
    """
    List all students with pending validation status.
    Only admin/academic_services can access this endpoint.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # Only admin can view pending students
    if user_type != "admin":
        return Response({"message": "Forbidden"}, status=HTTP_403_FORBIDDEN)

    try:
        pending_students = Student.objects.filter(validation_status="pending")

        data = []
        for student in pending_students:
            data.append({
                "student_number": student.student_number,
                "name": student.student_name,
                "email": student.user.email,
                "course": student.student_course.course_name if student.student_course else None,
                "validation_status": student.validation_status,
                "created_at": student.user.date_joined.isoformat() if hasattr(student.user, 'date_joined') else None
            })

        return Response(data, status=HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)
