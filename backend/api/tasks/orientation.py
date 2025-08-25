from api.models import *

# TODO : Orientações Automaticas
def handle_orientation(calendar_id):
    calendar = None
    try:
        calendar = Calendar.objects.get(calendar_id=calendar_id)
    except Calendar.DoesNotExist:
        print(f">> Calendar with id {calendar_id} not found.")
        return

    proposals = Proposal.objects.filter(calendar=calendar, company__isnull=False, isec_advisor=None)
    teachers = Teacher.objects.filter(scientific_area=calendar.course.scientific_area)