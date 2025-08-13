from django.urls import path
from .views import *

urlpatterns = [

    path('calendar/<int:pk>', getCalendar),
    path('calendar/create', createCalendar),
    path('calendar/<int:pk>/edit', editCalendar),
    path('calendar/<int:pk>/delete', deleteCalendar),

]