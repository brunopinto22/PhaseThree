from django.urls import path
from .views import *

urlpatterns = [
    path('teachers/', listTeachers),
    path('teacher/<int:pk>', getTeacher),
    path('teacher/create', createTeacher),
    path('teacher/<int:pk>/edit', editTeacher),
    path('teacher/<int:pk>/delete', deleteTeacher),
]