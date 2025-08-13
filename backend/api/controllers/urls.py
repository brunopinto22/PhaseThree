from django.urls import path, include

urlpatterns = [
    path('', include('api.controllers.System.urls')),
    path('', include('api.controllers.Account.urls')),
    path('', include('api.controllers.Course.urls')),
    path('', include('api.controllers.Calendar.urls')),
    path('', include('api.controllers.Teacher.urls')),
    path('', include('api.controllers.Student.urls')),
    path('', include('api.controllers.Company.urls')),
    path('', include('api.controllers.Representative.urls')),
    path('', include('api.controllers.Proposal.urls')),
]