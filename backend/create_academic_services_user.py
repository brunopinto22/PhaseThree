#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestor_estagios.settings')
django.setup()

from api.models import Accounts

TARGET_EMAIL = "servicos_academicos@isec.pt"
TARGET_USERNAME = "academic_services"
TARGET_PASSWORD = "servicos_academicos@123"

# Remover utilizadores anteriores com os emails antigos ou o alvo
old_emails = ["academic_services@test.com", TARGET_EMAIL]
deleted = Accounts.objects.filter(email__in=old_emails).delete()
if deleted[0] > 0:
    print(f"Removidos {deleted[0]} utilizadores antigos de academic_services.")

# Criar novo utilizador
user = Accounts.objects.create_user(
    username=TARGET_USERNAME,
    email=TARGET_EMAIL,
    password=TARGET_PASSWORD,
    user_type="academic_services"
)

print("✅ Utilizador academic_services criado com sucesso!")
print(f"   Email: {TARGET_EMAIL}")
print(f"   Palavra-passe: {TARGET_PASSWORD}")
print("   Tipo: academic_services")
