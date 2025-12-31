from django.urls import path
from .views import (
    getMyStudents,
    reassignAdvisor,
    getCalendarOrientations,
    triggerOrientationAssignment
)

urlpatterns = [
    path('orientation/my-students', getMyStudents, name='orientation-my-students'),
    path('orientation/proposal/<int:pk>/advisor', reassignAdvisor, name='orientation-reassign'),
    path('orientation/calendar/<int:pk>', getCalendarOrientations, name='orientation-calendar'),
    path('orientation/calendar/<int:pk>/assign', triggerOrientationAssignment, name='orientation-trigger'),
]

