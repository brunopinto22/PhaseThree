from django.urls import path
from .views import *

urlpatterns = [
    path('candidatures', listCandidatures),
    path('candidature/<int:pk>', getCandidature),
    path('candidature/create', createCandidature),
    path('candidature/<int:pk>/state', updateCandidatureState),
    path('candidature/<int:candidature_id>/proposal/<int:proposal_id>/state', updateCandidatureProposalState),
]
