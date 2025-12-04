from django.urls import path
from .views import (
    submitCandidature,
    getCandidature,
    getStudentCandidature,
    updateCandidature,
    listCandidatures,
    deleteCandidature
)

urlpatterns = [
    path('candidatures', listCandidatures),
    path('candidature/submit', submitCandidature),
    path('candidature/me', getStudentCandidature),
    path('candidature/<int:pk>', getCandidature),
    path('candidature/<int:pk>/edit', updateCandidature),
    path('candidature/<int:pk>/delete', deleteCandidature),
]

