from django.urls import path
from .views import *
from .validation_views import validateStudent, listPendingStudents

urlpatterns = [
    path('students/', listStudents),
<<<<<<< Updated upstream
    path('students/internships/', listStudentsWithInternships),
=======
    path('students/pending', listPendingStudents),
>>>>>>> Stashed changes
    path('student/<int:pk>', getStudent),
    path('student/register', registerStudent),
    path('student/create', createStudent),
    path('student/<int:pk>/edit', editStudent),
    path('student/<int:pk>/delete', deleteStudent),
    path('student/<int:pk>/validate', validateStudent),
    path('student/favorite/add/<int:proposal_id>', addFavorite),
    path('student/favorite/remove/<int:proposal_id>', removeFavorite),
]