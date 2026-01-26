from django.urls import path
from .views import *

urlpatterns = [
    path('students/', listStudents),
    path('students/internships/', listStudentsWithInternships),
    path('student/<int:pk>', getStudent),
    path('student/register', registerStudent),
    path('student/create', createStudent),
    path('student/import', importStudents),
    path('student/<int:pk>/edit', editStudent),
    path('student/<int:pk>/delete', deleteStudent),
    path('student/favorite/add/<int:proposal_id>', addFavorite),
    path('student/favorite/remove/<int:proposal_id>', removeFavorite),
]