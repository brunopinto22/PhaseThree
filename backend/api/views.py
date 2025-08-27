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


