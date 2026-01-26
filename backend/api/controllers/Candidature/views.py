"""
Candidature Controller Views
=============================

API endpoints for managing candidatures and protocol generation.

REQ-7: Automatic Protocol Generation
"""

import os
import traceback
from django.http import FileResponse, Http404
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.status import *

from api.models import Candidature, Student, Teacher, Permissions, Module
from api.token_manager import decode_token
from api.services.protocol_generator import ProtocolGenerator


@api_view(['POST'])
def generateProtocol(request, pk):
    """
    Manually generate protocol for a specific candidature.
    
    REQ-7: Automatic Protocol Generation
    
    Authorization: Admin, Teacher (with permissions), or Student (own candidature)
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        candidature = Candidature.objects.select_related(
            'student',
            'student__user'
        ).get(id_candidature=pk)
    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)

    # Authorization check
    if user_type == "student":
        student = Student.objects.get(user__email=user_email)
        if candidature.student != student:
            return Response({"message": "Sem permissão para gerar protocolo desta candidatura"}, status=HTTP_403_FORBIDDEN)
    elif user_type == "teacher":
        try:
            teacher = Teacher.objects.get(user__email=user_email)
            # Check if teacher has permissions or is advisor
            has_permission = False
            
            # Check module permissions
            try:
                candidature_module = Module.objects.get(module_name='Candidaturas')
                permission = Permissions.objects.get(teacher=teacher, module=candidature_module)
                if permission.can_edit:
                    has_permission = True
            except (Module.DoesNotExist, Permissions.DoesNotExist):
                pass
            
            # Check if teacher is advisor for this candidature's proposal
            accepted_proposal = candidature.candidature_proposals.filter(state='accepted').first()
            if accepted_proposal and accepted_proposal.proposal.isec_advisor == teacher:
                has_permission = True
            
            if not has_permission:
                return Response({"message": "Sem permissão para gerar protocolo"}, status=HTTP_403_FORBIDDEN)
        except Teacher.DoesNotExist:
            return Response({"message": "Docente não encontrado"}, status=HTTP_404_NOT_FOUND)
    elif user_type != "admin":
        return Response({"message": "Sem permissão para gerar protocolo"}, status=HTTP_401_UNAUTHORIZED)

    # Check if candidature is in correct state
    if candidature.state != 'placed':
        return Response({
            "message": f"Candidatura não está no estado correto para gerar protocolo (estado atual: {candidature.get_state_display()})"
        }, status=HTTP_400_BAD_REQUEST)

    # Check if protocol already exists
    if candidature.has_protocol():
        return Response({
            "message": "Protocolo já foi gerado para esta candidatura",
            "protocol_file": candidature.protocol_file.url if candidature.protocol_file else None
        }, status=HTTP_200_OK)

    # Generate protocol
    try:
        generator = ProtocolGenerator()
        protocol_path = generator.generate_protocol(candidature)
        
        if protocol_path:
            # Reload candidature to get updated protocol_file
            candidature.refresh_from_db()
            
            return Response({
                "message": "Protocolo gerado com sucesso",
                "protocol_file": candidature.protocol_file.url if candidature.protocol_file else None,
                "state": candidature.state
            }, status=HTTP_200_OK)
        else:
            return Response({
                "message": "Erro ao gerar protocolo. Verifique os logs para mais detalhes."
            }, status=HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        traceback.print_exc()
        return Response({
            "error": "Erro interno do servidor",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def downloadProtocol(request, pk):
    """
    Download the generated protocol for a candidature.
    
    Authorization: Admin, Teacher (with permissions), or Student (own candidature)
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        candidature = Candidature.objects.select_related(
            'student',
            'student__user'
        ).get(id_candidature=pk)
    except Candidature.DoesNotExist:
        return Response({"message": "Candidatura não encontrada"}, status=HTTP_404_NOT_FOUND)

    # Authorization check
    if user_type == "student":
        student = Student.objects.get(user__email=user_email)
        if candidature.student != student:
            return Response({"message": "Sem permissão para descarregar protocolo desta candidatura"}, status=HTTP_403_FORBIDDEN)
    elif user_type == "teacher":
        try:
            teacher = Teacher.objects.get(user__email=user_email)
            has_permission = False
            
            # Check module permissions
            try:
                candidature_module = Module.objects.get(module_name='Candidaturas')
                permission = Permissions.objects.get(teacher=teacher, module=candidature_module)
                if permission.can_view:
                    has_permission = True
            except (Module.DoesNotExist, Permissions.DoesNotExist):
                pass
            
            # Check if teacher is advisor
            accepted_proposal = candidature.candidature_proposals.filter(state='accepted').first()
            if accepted_proposal and accepted_proposal.proposal.isec_advisor == teacher:
                has_permission = True
            
            if not has_permission:
                return Response({"message": "Sem permissão para descarregar protocolo"}, status=HTTP_403_FORBIDDEN)
        except Teacher.DoesNotExist:
            return Response({"message": "Docente não encontrado"}, status=HTTP_404_NOT_FOUND)
    elif user_type != "admin":
        return Response({"message": "Sem permissão para descarregar protocolo"}, status=HTTP_401_UNAUTHORIZED)

    # Check if protocol exists
    if not candidature.has_protocol():
        return Response({
            "message": "Protocolo ainda não foi gerado para esta candidatura"
        }, status=HTTP_404_NOT_FOUND)

    try:
        protocol_file = candidature.protocol_file
        
        if not protocol_file or not protocol_file.storage.exists(protocol_file.name):
            return Response({
                "message": "Ficheiro do protocolo não encontrado"
            }, status=HTTP_404_NOT_FOUND)

        # Generate safe filename
        filename = os.path.basename(protocol_file.name)
        
        # Open and return file
        file_handle = protocol_file.storage.open(protocol_file.name, 'rb')
        response = FileResponse(
            file_handle,
            content_type='application/pdf',
            as_attachment=True,
            filename=filename
        )
        response['Access-Control-Expose-Headers'] = 'Content-Disposition, X-Filename'
        return response
        
    except Exception as e:
        traceback.print_exc()
        return Response({
            "error": "Erro interno do servidor",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def generateProtocolsBatch(request):
    """
    Generate protocols for multiple candidatures in batch.
    
    REQ-7: Automatic Protocol Generation
    
    Authorization: Admin or Teacher (with permissions)
    
    Request body:
    {
        "candidature_ids": [1, 2, 3, ...]
    }
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type not in ["admin", "teacher"]:
        return Response({"message": "Sem permissão para gerar protocolos"}, status=HTTP_401_UNAUTHORIZED)

    if user_type == "teacher":
        try:
            teacher = Teacher.objects.get(user__email=user_email)
            try:
                candidature_module = Module.objects.get(module_name='Candidaturas')
                permission = Permissions.objects.get(teacher=teacher, module=candidature_module)
                if not permission.can_edit:
                    return Response({"message": "Sem permissão para gerar protocolos"}, status=HTTP_403_FORBIDDEN)
            except (Module.DoesNotExist, Permissions.DoesNotExist):
                return Response({"message": "Sem permissão para gerar protocolos"}, status=HTTP_403_FORBIDDEN)
        except Teacher.DoesNotExist:
            return Response({"message": "Docente não encontrado"}, status=HTTP_404_NOT_FOUND)

    candidature_ids = request.data.get("candidature_ids", [])
    
    if not candidature_ids or not isinstance(candidature_ids, list):
        return Response({"message": "Lista de IDs de candidaturas é obrigatória"}, status=HTTP_400_BAD_REQUEST)

    try:
        candidatures = Candidature.objects.filter(
            id_candidature__in=candidature_ids,
            state='placed'
        ).select_related('student', 'student__user')
        
        if not candidatures.exists():
            return Response({
                "message": "Nenhuma candidatura no estado 'placed' encontrada"
            }, status=HTTP_404_NOT_FOUND)

        generator = ProtocolGenerator()
        results = generator.generate_protocols_batch(list(candidatures))
        
        return Response({
            "message": "Geração de protocolos concluída",
            "results": results
        }, status=HTTP_200_OK)
        
    except Exception as e:
        traceback.print_exc()
        return Response({
            "error": "Erro interno do servidor",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
