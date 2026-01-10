from django.urls import path
from .views import (
    academicDashboard,
    listPlacements,
    advanceCandidature,
    pendingActions,
    exportPlacements,
    listPendingRegistrations,
    validateStudentRegistration
)

urlpatterns = [
    path('academic/dashboard', academicDashboard),
    path('academic/placements', listPlacements),
    path('academic/placements/export', exportPlacements),
    path('academic/candidature/<int:pk>/advance', advanceCandidature),
    path('academic/pending-actions', pendingActions),
    path('academic/registrations', listPendingRegistrations),
    path('academic/registrations/<int:student_number>/validate', validateStudentRegistration),
]

