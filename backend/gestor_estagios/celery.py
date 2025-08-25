import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "gestor_estagios.settings")

app = Celery("gestor_estagios")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()