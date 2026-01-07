from django.urls import path
from . import views

urlpatterns = [
    path('candidature/submit/', views.submitCandidature, name='submit_candidature'),
    path('candidature/update/<int:pk>/', views.updateCandidature, name='update_candidature'),
    path('candidature/me/', views.getMyCandidature, name='get_my_candidature'),
]
