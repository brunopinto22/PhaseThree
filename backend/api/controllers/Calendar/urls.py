from django.urls import path
from .views import *

urlpatterns = [

    path('calendar/<int:pk>', getCalendar),
    path('calendar/create', createCalendar),
    path('calendar/<int:pk>/edit', editCalendar),
    path('calendar/<int:pk>/delete', deleteCalendar),
    # REQ-4: Trigger placements
    path('calendar/<int:pk>/placements', triggerPlacements),

]