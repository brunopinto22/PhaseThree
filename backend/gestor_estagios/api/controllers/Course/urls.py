from django.urls import path
from .views import *

urlpatterns = [

    path('courses', listCourses),
    path('course/<int:pk>', getCourse),
    path('course/create', createCourse),
    path('course/<int:pk>/edit', editCourse),
    path('course/<int:pk>/delete', deleteCourse),

]