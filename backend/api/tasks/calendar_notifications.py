"""
Celery Tasks for Calendar Notifications
========================================

This module provides Celery tasks for asynchronous calendar notification processing.

REQ-15: Notification System - Notify Companies about New Calendars

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
def notify_companies_new_calendar_async(self, calendar_id: int) -> Optional[Dict[str, Any]]:
    """
    Async Celery task to notify companies about a new calendar.
    
    This task is designed to be resilient with automatic retries
    in case of transient failures (e.g., email server issues).
    
    Args:
        calendar_id: Primary key of the Calendar instance
        
    Returns:
        Dictionary with notification results
    """
    from api.models import Calendar
    from api.services.calendar_notifications import CalendarNotificationService
    
    logger.info(f"Celery task: Notifying companies about calendar {calendar_id}")
    
    try:
        calendar = Calendar.objects.select_related('course').get(id_calendar=calendar_id)
        notification_service = CalendarNotificationService()
        results = notification_service.notify_companies_new_calendar(calendar)
        
        logger.info(
            f"Celery task completed: {results.get('successful', 0)}/{results.get('total', 0)} "
            f"notifications sent successfully"
        )
        
        return results
        
    except Calendar.DoesNotExist:
        logger.error(f"Celery task: Calendar {calendar_id} not found")
        return None
    except Exception as e:
        logger.exception(f"Celery task failed: {str(e)}")
        raise


@shared_task
def notify_companies_new_calendar_manual(calendar_id: int) -> Optional[Dict[str, Any]]:
    """
    Manual trigger for calendar notifications.
    
    This function can be called from the admin panel or API endpoint
    to manually trigger calendar notifications for a specific calendar.
    
    Args:
        calendar_id: Primary key of the Calendar instance
        
    Returns:
        Dictionary with notification results, or None if calendar not found
    """
    logger.info(f"Manual calendar notification triggered for calendar_id: {calendar_id}")
    return notify_companies_new_calendar_async(calendar_id)
