
import os
import django
from django.urls import reverse, resolve

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestor_estagios.settings')
django.setup()

try:
    url = '/api/student/2021222222/edit'
    resolved = resolve(url)
    print(f"SUCCESS: Resolved to {resolved.func.__name__}")
except Exception as e:
    print(f"FAILURE: {e}")

