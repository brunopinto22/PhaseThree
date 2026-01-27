
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from api.models import Candidature

print("Current Candidature State Choices Order:")
for code, label in Candidature.STATE_CHOICES:
    print(f"- {code}")
