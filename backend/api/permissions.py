from rest_framework import permissions
from django.http import JsonResponse
from .token_manager import decode_token

class IsAuthenticated(permissions.BasePermission):

    def has_permission(self, request, view):
        token = request.headers.get("Authorization")
        print("Token:", token)
        decoded = decode_token(token)
        if not decoded:
            return JsonResponse({"error": "Invalid or expired token"}, status=403)
        user, type = decoded
        print("User type:", type)

        return True
