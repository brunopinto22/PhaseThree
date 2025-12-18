from django.urls import path
from .views import (
    submitCandidature,
    getCandidature,
    getStudentCandidature,
    updateCandidature,
    listCandidatures,
    deleteCandidature,
    changeCandidatureState
)

urlpatterns = [
    path('candidatures', listCandidatures),
    path('candidature/submit', submitCandidature),
    path('candidature/me', getStudentCandidature),
    path('candidature/<int:pk>', getCandidature),
    path('candidature/<int:pk>/edit', updateCandidature),
    path('candidature/<int:pk>/delete', deleteCandidature),
    path('candidature/<int:pk>/state', changeCandidatureState),
]

