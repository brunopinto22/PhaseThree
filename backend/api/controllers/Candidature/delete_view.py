from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.status import *
from api.models import Candidature
from api.token_manager import decode_token

@api_view(["DELETE"])
def deleteCandidature(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # Only Admin can delete candidatures
    if user_type != "admin":
         return Response({"message": "Forbidden"}, status=HTTP_403_FORBIDDEN)

    try:
        candidature = Candidature.objects.get(id_candidature=pk)
        candidature.delete()
        return Response({"message": "Candidature deleted"}, status=HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidature not found"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)
