#!/usr/bin/env python
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestor_estagios.settings')
django.setup()

from api.models import Calendar

print("=== Ativar Calendário para Testes ===\n")

# Encontrar um calendário
calendars = Calendar.objects.all()

if not calendars.exists():
    print("❌ Nenhum calendário encontrado na BD!")
    exit(1)

print(f"Encontrados {calendars.count()} calendários:\n")

for i, cal in enumerate(calendars, 1):
    print(f"{i}. {cal} - Ativo: {cal.is_submission_active}")

# Usar o primeiro calendário
calendar = calendars.first()

# Ativar datas para o calendário
today = date.today()
calendar.submission_start = today - timedelta(days=10)
calendar.submission_end = today + timedelta(days=30)
calendar.divulgation = today + timedelta(days=40)
calendar.candidatures = today + timedelta(days=50)
calendar.placements = today + timedelta(days=60)

calendar.save()

print(f"\n✅ Calendário ativado!")
print(f"   Título: {calendar}")
print(f"   Submissão: {calendar.submission_start} a {calendar.submission_end}")
print(f"   Divulgação: {calendar.divulgation}")
print(f"   Candidaturas: {calendar.candidatures}")
print(f"   Placements: {calendar.placements}")
print(f"\n✅ Agora podes criar propostas!")
