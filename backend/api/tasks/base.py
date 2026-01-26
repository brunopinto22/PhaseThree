from celery import shared_task
from datetime import date
from api.models import Calendar
from api.tasks.orientation import handle_orientation
from api.tasks.placements import handle_placements, handle_automatic_placements


@shared_task
def verify_day_events():
    """
    Task agendada que roda diariamente às 00:05.
    Verifica eventos do dia para cada calendário:
    - Divulgação: Envia orientações
    - Placements: Executa colocação automática de alunos
    """
    today = date.today()
    calendars = Calendar.objects.all()

    for c in calendars:

        if c.divulgation == today:
            handle_orientation(c.id_calendar)

        elif c.placements == today:
            # Chama handle_placements que agora usa colocação automática
            handle_placements(c.id_calendar)


@shared_task
def run_placement_for_calendar(calendar_id):
    """
    Task manual para executar placement de um calendário específico.
    Útil para testes ou execução manual via admin.
    
    Args:
        calendar_id: ID do calendário
    """
    handle_automatic_placements(calendar_id)
    return f"Placement executado para calendário {calendar_id}"
