"""
Celery Tasks Package
====================

This package contains all Celery tasks for the ISEC Internship and Project
Partnerships Management System.

Tasks:
- base.py: Core scheduled tasks (daily event verification)
- placements.py: Placement results processing and notifications
- orientation.py: Automatic advisor assignment
- notification_tasks.py: Async notification sending

Author: PhaseThree Team
"""

from .base import verify_day_events
from .placements import handle_placements, send_placement_notifications_manual
from .notification_tasks import (
    send_placement_notifications_async,
    send_single_notification_async,
    send_bulk_notifications_async,
    generate_protocol_async,
)
from .calendar_notifications import (
    notify_companies_new_calendar_async,
    notify_companies_new_calendar_manual,
)
from .application_notifications import (
    notify_companies_application_async,
    notify_companies_application_manual,
)

__all__ = [
    'verify_day_events',
    'handle_placements',
    'send_placement_notifications_manual',
    'send_placement_notifications_async',
    'send_single_notification_async',
    'send_bulk_notifications_async',
    'generate_protocol_async',
    'notify_companies_new_calendar_async',
    'notify_companies_new_calendar_manual',
    'notify_companies_application_async',
    'notify_companies_application_manual',
]