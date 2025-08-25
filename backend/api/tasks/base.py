from celery import shared_task
from datetime import date
from api.models import Calendar
from api.tasks.orientation import handle_orientation
from api.tasks.placements import handle_placements


@shared_task
def verify_day_events():
    today = date.today()
    calendars = Calendar.objects.all()

    for c in calendars:

        if c.divulgation == today:
            handle_orientation(c.id_calendar)

        elif c.placements == today:
            handle_placements(c.id_calendar)
