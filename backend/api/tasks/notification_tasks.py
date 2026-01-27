"""
Celery Tasks for Notification Processing
========================================

This module provides Celery tasks for asynchronous notification processing.
These tasks allow notifications to be sent in the background without blocking
the main request/response cycle.

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
def send_placement_notifications_async(self, calendar_id: int) -> Optional[Dict[str, Any]]:
    """
    Async Celery task to send placement notifications.
    
    This task is designed to be resilient with automatic retries
    in case of transient failures (e.g., email server issues).
    
    Args:
        calendar_id: Primary key of the Calendar instance
        
    Returns:
        Dictionary with processing results
    """
    from api.tasks.placements import handle_placements
    
    logger.info(f"Celery task: Processing placement notifications for calendar {calendar_id}")
    
    try:
        result = handle_placements(calendar_id)
        
        if result:
            logger.info(f"Celery task completed successfully: {result.get('total', 0)} notifications sent")
        else:
            logger.warning(f"Celery task: Calendar {calendar_id} not found or no results")
            
        return result
        
    except Exception as e:
        logger.exception(f"Celery task failed: {str(e)}")
        raise


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def send_single_notification_async(
    self,
    notification_type: str,
    recipient_email: str,
    subject: str,
    body: str
) -> bool:
    """
    Async Celery task to send a single notification email.
    
    This is a low-level task for sending individual emails asynchronously.
    Useful for one-off notifications or custom email sending.
    
    Args:
        notification_type: Type of notification (for logging)
        recipient_email: Email address of the recipient
        subject: Email subject
        body: Email body
        
    Returns:
        True if successful, raises exception on failure
    """
    from django.core.mail import send_mail
    from django.conf import settings
    
    logger.info(f"Sending async notification ({notification_type}) to {recipient_email}")
    
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER),
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        
        logger.info(f"Notification sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send notification to {recipient_email}: {str(e)}")
        raise


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def generate_protocol_async(self, candidature_id: int) -> Optional[str]:
    """
    Async Celery task to generate a protocol for a candidature.
    
    Args:
        candidature_id: Primary key of the Candidature instance
        
    Returns:
        Path to the generated protocol file, or None on failure
    """
    from api.models import Candidature
    from api.services.protocol_generator import ProtocolGenerator
    
    logger.info(f"Celery task: Generating protocol for candidature {candidature_id}")
    
    try:
        candidature = Candidature.objects.get(id_candidature=candidature_id)
        generator = ProtocolGenerator()
        protocol_path = generator.generate_protocol(candidature)
        
        if protocol_path:
            logger.info(f"Celery task: Protocol generated successfully: {protocol_path}")
        else:
            logger.warning(f"Celery task: Protocol generation returned None for candidature {candidature_id}")
            
        return protocol_path
        
    except Candidature.DoesNotExist:
        logger.error(f"Celery task: Candidature {candidature_id} not found")
        return None
    except Exception as e:
        logger.exception(f"Celery task failed: {str(e)}")
        raise


@shared_task
def send_bulk_notifications_async(notifications: list) -> Dict[str, int]:
    """
    Async Celery task to send multiple notification emails.
    
    Args:
        notifications: List of dicts with 'recipient_email', 'subject', 'body' keys
        
    Returns:
        Dictionary with 'successful' and 'failed' counts
    """
    from django.core.mail import send_mail
    from django.conf import settings
    
    successful = 0
    failed = 0
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)
    
    for notification in notifications:
        try:
            send_mail(
                subject=notification['subject'],
                message=notification['body'],
                from_email=from_email,
                recipient_list=[notification['recipient_email']],
                fail_silently=False,
            )
            successful += 1
        except Exception as e:
            logger.error(f"Failed to send to {notification.get('recipient_email')}: {str(e)}")
            failed += 1
    
    logger.info(f"Bulk notification complete: {successful} successful, {failed} failed")
    
    return {
        'successful': successful,
        'failed': failed,
        'total': len(notifications)
    }
