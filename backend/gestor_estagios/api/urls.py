from django.urls import path, include
from .views import *

urlpatterns = [
    path('', include('api.controllers.urls')),

    path('token/test', test_token),

    path('scientificAreas/', listScientificAreas),
    path('scientificArea/add', addArea),
    path('scientificArea/<int:pk>/edit', editArea),
    path('scientificArea/<int:pk>/delete', deleteArea),

    path('user/login', login),
    path('user/register', register),
    path('user/password/recover', recuperar_password),
    path('user/password/recover/confirm', recuperar_password_confirm),

]