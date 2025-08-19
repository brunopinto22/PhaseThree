from django.urls import path
from .views import *

urlpatterns = [
    path('company/register', registerCompany),
    path('companies', listCompanies),
    path('company/<int:pk>', getCompany),
    path('company/<int:pk>/edit', editCompany),
    path('company/<int:pk>/delete', deleteCompany),
    path('company/invite', invite),
]