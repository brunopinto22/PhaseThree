from django.urls import path
from .views import *

urlpatterns = [
    path('proposals', listProposals),
    path('proposal/<int:pk>', getProposal),
    path('proposal/create', createProposal),
    path('proposal/<int:pk>/edit', editProposal),
    path('proposal/<int:pk>/delete', deleteProposal),
    path('proposal/<int:pk>/pdf', generatePdf),
    path('proposal/<int:proposal_id>/candidates/', getProposalCandidates),
    path('proposal/<int:proposal_id>/candidates/<int:student_number>/accept', acceptCandidate),
    path('proposal/<int:proposal_id>/candidates/<int:student_number>/reject', rejectCandidate),
]