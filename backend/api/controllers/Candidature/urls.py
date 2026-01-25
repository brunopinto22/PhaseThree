from django.urls import path
from .views import getCandidature, updateCandidatureState, updateCandidatureProposalState, listCandidatures
from .delete_view import deleteCandidature

urlpatterns = [
    path('candidature/<int:pk>', getCandidature),
    path('candidature/<int:pk>/state', updateCandidatureState),
    path('candidature/proposal/<int:pk>/state', updateCandidatureProposalState),
    path('candidatures/', listCandidatures),
    path('candidature/<int:pk>/delete', deleteCandidature),
]
