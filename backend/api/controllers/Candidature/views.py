"""
Candidature Controller Views
============================

API endpoints for managing candidatures.

REQ-16: Notification System - Notify Companies about Application Results
"""

import json
import traceback
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.status import *

from api.models import Candidature, CandidatureProposal, Student, Proposal, Settings
from api.token_manager import decode_token


@api_view(['POST'])
def createCandidature(request):
    """
    Create a new candidature for a student.
    
    REQ-16: Notification System - Notify Companies about Application Results
    
    This endpoint creates a candidature and notifies companies whose
    proposals are included in the candidature.
    
    Request body:
    {
        "student_id": 12345,
        "proposal_ids": [1, 2, 3],
        "submission_date": "2025-01-24"
    }
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    if user_type != "student":
        return Response({"message": "Apenas alunos podem submeter candidaturas"}, status=HTTP_401_UNAUTHORIZED)

    try:
        # Get student
        student = Student.objects.get(user__email=user_email)
        
        # Validate proposal IDs
        proposal_ids = request.data.get("proposal_ids", [])
        if not proposal_ids or not isinstance(proposal_ids, list):
            return Response({"message": "Lista de IDs de propostas é obrigatória"}, status=HTTP_400_BAD_REQUEST)
        
        # Get proposals
        proposals = Proposal.objects.filter(id_proposal__in=proposal_ids)
        
        if proposals.count() != len(proposal_ids):
            return Response({"message": "Uma ou mais propostas não foram encontradas"}, status=HTTP_404_NOT_FOUND)
        
        # Validate calendar
        calendar = proposals.first().calendar
        if not all(p.calendar == calendar for p in proposals):
            return Response({"message": "Todas as propostas devem pertencer ao mesmo calendário"}, status=HTTP_400_BAD_REQUEST)
        
        if student.calendar != calendar:
            return Response({"message": "O calendário das propostas não corresponde ao seu calendário"}, status=HTTP_400_BAD_REQUEST)
        
        # Validate submission date
        from datetime import date
        submission_date = request.data.get("submission_date")
        if submission_date:
            try:
                submission_date = date.fromisoformat(submission_date)
            except ValueError:
                return Response({"message": "Data de submissão inválida"}, status=HTTP_400_BAD_REQUEST)
        else:
            submission_date = date.today()
        
        # Validate calendar dates
        if not (calendar.candidatures <= submission_date <= calendar.placements):
            return Response({
                "message": f"Período de candidaturas: {calendar.candidatures} a {calendar.placements}"
            }, status=HTTP_400_BAD_REQUEST)
        
        # Validate min/max proposals
        if len(proposal_ids) < calendar.min_proposals:
            return Response({
                "message": f"Deve candidatar-se a pelo menos {calendar.min_proposals} proposta(s)"
            }, status=HTTP_400_BAD_REQUEST)
        
        if len(proposal_ids) > calendar.max_proposals:
            return Response({
                "message": f"Pode candidatar-se a no máximo {calendar.max_proposals} proposta(s)"
            }, status=HTTP_400_BAD_REQUEST)
        
        # Check if student already has a candidature for this calendar
        existing_candidature = Candidature.objects.filter(
            student=student,
            candidature_submission_date__gte=calendar.candidatures
        ).first()
        
        if existing_candidature:
            return Response({
                "message": "Já possui uma candidatura para este calendário"
            }, status=HTTP_400_BAD_REQUEST)
        
        # Create candidature
        candidature = Candidature.objects.create(
            student=student,
            state='submitted',
            candidature_submission_date=submission_date
        )
        
        # Create candidature proposals
        for proposal in proposals:
            CandidatureProposal.objects.create(
                candidature=candidature,
                proposal=proposal,
                state='pending'
            )
        
        # REQ-16: Notify companies about application submission
        notification_results = None
        try:
            settings = Settings.objects.first()
            if settings and getattr(settings, 'notify_companies_applications', True):
                # Check if async notification is requested
                use_async = request.data.get("notify_async", False)
                
                if use_async:
                    # Use Celery task for async notification
                    from api.tasks.application_notifications import notify_companies_application_async
                    task = notify_companies_application_async.delay(candidature.id_candidature)
                    notification_results = {"task_id": task.id, "mode": "async"}
                else:
                    # Synchronous notification
                    from api.services.application_notifications import ApplicationNotificationService
                    notification_service = ApplicationNotificationService()
                    notification_results = notification_service.notify_companies_application_submitted(candidature)
                    notification_results["mode"] = "sync"
        except Exception as e:
            # Log error but don't fail candidature creation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error sending application notifications: {str(e)}")
        
        return Response({
            "message": "Candidatura submetida com sucesso",
            "candidature_id": candidature.id_candidature,
            "notifications": notification_results
        }, status=status.HTTP_201_CREATED)
        
    except Student.DoesNotExist:
        return Response({"message": "Aluno não encontrado"}, status=HTTP_404_NOT_FOUND)
    except Proposal.DoesNotExist:
        return Response({"message": "Uma ou mais propostas não foram encontradas"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({
            "error": "Erro interno do servidor",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
