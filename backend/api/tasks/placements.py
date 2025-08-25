from api.models import *

# TODO : Colocações Automaticas
def handle_placements(calendar_id):
    calendar = None
    try:
        calendar = Calendar.objects.get(calendar_id=calendar_id)
    except Calendar.DoesNotExist:
        print(f">> Calendar with id {calendar_id} not found.")
        return
    print(f">> Placements of {calendar.__str__()}")