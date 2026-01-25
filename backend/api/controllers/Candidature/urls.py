from django.urls import path
from . import views

urlpatterns = [
    path('candidature/list/', views.listAllCandidatures, name='list_all_candidatures'),
    path('candidature/submit/', views.submitCandidature, name='submit_candidature'),
    path('candidature/update/<int:pk>/', views.updateCandidature, name='update_candidature'),
    path('candidature/me/', views.getMyCandidature, name='get_my_candidature'),
    path('candidature/<int:pk>/history/', views.getCandidatureHistory, name='get_candidature_history'),
    path('candidature/delete/', views.deleteCandidature, name='delete_candidature'),
]

