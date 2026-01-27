"""
Celery Tasks for Application Notifications
==========================================

This module provides Celery tasks for asynchronous application notification processing.

REQ-16: Notification System - Notify Companies about Application Results

Author: PhaseThree Team
"""

import logging
from celery import shared_task
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
)
def notify_companies_application_async(self, candidature_id: int) -> Optional[Dict[str, Any]]:
    """
    Async Celery task to notify companies about a new application/candidature.
    
    This task is designed to be resilient with automatic retries
    in case of transient failures (e.g., email server issues).
    
    Args:
        candidature_id: Primary key of the Candidature instance
        
    Returns:
        Dictionary with notification results
    """
    from api.models import Candidature
    from api.services.application_notifications import ApplicationNotificationService
    
    logger.info(f"Celery task: Notifying companies about candidature {candidature_id}")
    
    try:
        candidature = Candidature.objects.select_related(
            'student',
            'student__user',
            'student__student_course',
            'student__student_branch'
        ).get(id_candidature=candidature_id)
        
        notification_service = ApplicationNotificationService()
        results = notification_service.notify_companies_application_submitted(candidature)
        
        logger.info(
            f"Celery task completed: {results.get('successful', 0)}/{results.get('total', 0)} "
            f"notifications sent successfully"
        )
        
        return results
        
    except Candidature.DoesNotExist:
        logger.error(f"Celery task: Candidature {candidature_id} not found")
        return None
    except Exception as e:
        logger.exception(f"Celery task failed: {str(e)}")
        raise


@shared_task
def notify_companies_application_manual(candidature_id: int) -> Optional[Dict[str, Any]]:
    """
    Manual trigger for application notifications.
    
    This function can be called from the admin panel or API endpoint
    to manually trigger application notifications for a specific candidature.
    
    Args:
        candidature_id: Primary key of the Candidature instance
        
    Returns:
        Dictionary with notification results, or None if candidature not found
    """
    logger.info(f"Manual application notification triggered for candidature_id: {candidature_id}")
    return notify_companies_application_async(candidature_id)
