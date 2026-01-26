from django.core.management.base import BaseCommand
from api.models import Calendar
from api.tasks.placements import handle_automatic_placements


class Command(BaseCommand):
    help = 'Executa colocação automática de alunos para um calendário específico ou todos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--calendar',
            type=int,
            help='ID do calendário específico (opcional)',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Executar para todos os calendários',
        )

    def handle(self, *args, **options):
        calendar_id = options.get('calendar')
        run_all = options.get('all')

        if calendar_id:
            # Executar para calendário específico
            try:
                calendar = Calendar.objects.get(id_calendar=calendar_id)
                self.stdout.write(self.style.SUCCESS(f'Executando placement para: {calendar}'))
                handle_automatic_placements(calendar_id)
                self.stdout.write(self.style.SUCCESS('✓ Concluído!'))
            except Calendar.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Calendário {calendar_id} não encontrado'))
        
        elif run_all:
            # Executar para todos os calendários
            calendars = Calendar.objects.all()
            self.stdout.write(self.style.SUCCESS(f'Executando placement para {calendars.count()} calendários'))
            
            for calendar in calendars:
                self.stdout.write(f'\n--- {calendar} ---')
                handle_automatic_placements(calendar.id_calendar)
            
            self.stdout.write(self.style.SUCCESS('\n✓ Todos concluídos!'))
        
        else:
            self.stdout.write(self.style.ERROR('Especifique --calendar <ID> ou --all'))
