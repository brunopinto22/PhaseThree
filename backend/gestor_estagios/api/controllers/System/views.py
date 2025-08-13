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
def getSupportEmail(request):
    info = Settings.objects.first()
    return JsonResponse(info.support_email, status=HTTP_200_OK, safe=False)

@api_view(["GET"])
def getSystemInfo(request):
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

    info = Settings.objects.first()
    areas = ScientificArea.objects.all()

    data = {
        "info": info,
        "areas": [
            {
                "id": a.id_area,
                "area_name": a.area_name,
                "n_courses": Course.objects.filter(scientific_area=a).count(),
                "n_teachers": Teacher.objects.filter(scientific_area=a).count(),
            }
            for a in areas
        ],
    }

    return JsonResponse(data, status=200)

@api_view(["GET"])
def getModules(request):
    modules = list(Module.objects.values())
    return JsonResponse(modules, status=200, safe=False)
