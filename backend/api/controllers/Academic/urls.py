from django.urls import path
from .views import (
    academicDashboard,
    listPlacements,
    advanceCandidature,
    pendingActions,
    exportPlacements
)

urlpatterns = [
    path('academic/dashboard', academicDashboard),
    path('academic/placements', listPlacements),
    path('academic/placements/export', exportPlacements),
    path('academic/candidature/<int:pk>/advance', advanceCandidature),
    path('academic/pending-actions', pendingActions),
]

