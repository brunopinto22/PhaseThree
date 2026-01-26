from django.urls import path
from .views import *

urlpatterns = [
    # REQ-7: Automatic Protocol Generation
    path('candidature/<int:pk>/generate-protocol', generateProtocol),
    path('candidature/<int:pk>/download-protocol', downloadProtocol),
    path('candidature/generate-protocols-batch', generateProtocolsBatch),
]
