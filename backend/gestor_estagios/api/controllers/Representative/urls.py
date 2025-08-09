from django.urls import path
from .views import *

urlpatterns = [

    path('representative/<int:pk>', getRepresentative),
    path('representative/create', createRepresentative),
    path('representative/<int:pk>/edit', editRepresentative),
    path('representative/<int:pk>/delete', deleteRepresentative),

]