from django.urls import path
from .views import *

urlpatterns = [
    path('students/', listStudents),
    path('student/<int:pk>', getStudent),
    path('student/create', createStudent),
    path('student/<int:pk>/edit', editStudent),
    path('student/<int:pk>/delete', deleteStudent),
    path('student/<int:pk>/favorites', getFavorites),
    path('student/<int:pk>/favorite/add/<int:proposal_id>', addFavorite),
    path('student/<int:pk>/favorite/remove/<int:proposal_id>', removeFavorite),
]