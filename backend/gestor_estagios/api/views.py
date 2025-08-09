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

from .models import *
from .serializers import *
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
            "area_name": a.area_name,
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
ACCOUNT
"""
@api_view(["POST"])
def login(request):
    data = request.data
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return Response({"message": "Email e palavra-passe são obrigatórios."}, status=HTTP_400_BAD_REQUEST)

    user = Accounts.objects.filter(email=email).first()

    if user is None:
        return Response({"message": "Email não foi encontrado."}, status=HTTP_401_UNAUTHORIZED)

    if not user.check_password(password):
        return Response({"message": "Palavra-passe incorreta."}, status=HTTP_401_UNAUTHORIZED)

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


@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User registered successfully"}, status=HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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

