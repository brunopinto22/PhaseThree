from django.urls import path
from .views import *

urlpatterns = [
    path('user/login', login),
    path('user/authenticate', authenticate),
    path('user/password/set', setPassword),
    path('user/password/recover', recuperar_password),
    path('user/password/recover/confirm', recuperar_password_confirm),
]