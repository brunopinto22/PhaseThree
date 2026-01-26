from django.urls import path
from .views import *

urlpatterns = [
    # REQ-16: Application Results Notification
    path('candidature/create', createCandidature),
]
