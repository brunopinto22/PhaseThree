from django.urls import path
from .views import (
    generateProtocol,
    downloadProtocol,
    getProtocol,
    signProtocol,
    completeProtocol,
    listProtocols
)

urlpatterns = [
    path('protocols', listProtocols),
    path('protocol/<int:pk>', getProtocol),
    path('protocol/<int:pk>/generate', generateProtocol),
    path('protocol/<int:pk>/download', downloadProtocol),
    path('protocol/<int:pk>/sign', signProtocol),
    path('protocol/<int:pk>/complete', completeProtocol),
]

