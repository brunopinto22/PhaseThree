"""
Base Celery Tasks
=================

This module contains the core scheduled tasks that run on a daily basis
via Celery Beat.

The main task `verify_day_events` checks all calendars for events that
should trigger on the current date:
- Divulgation date: Triggers automatic orientation assignment
- Placements date: Triggers placement result notifications

Author: PhaseThree Team
"""

import logging
from celery import shared_task
from datetime import date

from api.models import Calendar

logger = logging.getLogger(__name__)


@shared_task
def verify_day_events():
    """
    Daily task that checks all calendars for events scheduled for today.
    
    This task runs at 00:05 each day (configured in settings.py) and triggers:
    - handle_orientation: When divulgation date matches today
    - handle_placements: When placements date matches today
    
    The task processes all active calendars and handles each event appropriately.
    """
    from api.tasks.orientation import handle_orientation
    from api.tasks.placements import handle_placements
    
    today = date.today()
    logger.info(f"Running daily event verification for {today}")
    
    calendars = Calendar.objects.select_related('course').all()
    events_triggered = 0
    
    for calendar in calendars:
        calendar_str = str(calendar)
        
        # Check for divulgation event (proposal disclosure + orientation assignment)
        if calendar.divulgation == today:
            logger.info(f"Triggering orientation assignment for calendar: {calendar_str}")
            try:
                handle_orientation(calendar.id_calendar)
                events_triggered += 1
            except Exception as e:
                logger.exception(f"Error in orientation handling for {calendar_str}: {str(e)}")
        
        # Check for placements event (placement results notification)
        elif calendar.placements == today:
            logger.info(f"Triggering placement notifications for calendar: {calendar_str}")
            try:
                result = handle_placements(calendar.id_calendar)
                if result:
                    logger.info(
                        f"Placement notifications sent for {calendar_str}: "
                        f"{result.get('successful', 0)}/{result.get('total', 0)} successful"
                    )
                events_triggered += 1
            except Exception as e:
                logger.exception(f"Error in placement handling for {calendar_str}: {str(e)}")
    
    logger.info(f"Daily event verification completed. Events triggered: {events_triggered}")
    
    return {
        'date': str(today),
        'calendars_checked': calendars.count(),
        'events_triggered': events_triggered
    }
