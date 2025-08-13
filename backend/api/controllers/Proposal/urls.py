from django.urls import path
from .views import *

urlpatterns = [

    path('proposals', listProposals),
    path('proposal/<int:pk>', getProposal),
    path('proposal/create', createProposal),
    path('proposal/<int:pk>/edit', editProposal),
    path('proposal/<int:pk>/delete', deleteProposal),

]