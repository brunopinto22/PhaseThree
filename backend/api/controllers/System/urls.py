from django.urls import path
from .views import *

urlpatterns = [
    path('system/supportEmail', getSupportEmail),
    path('system/info', getSystemInfo),
    path('system/modules', getModules),
    path('system/edit', editSystem),
]