from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('google/', views.google_login, name='google-login'),
    path('staff/login/', views.staff_login, name='staff-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', views.me, name='me'),
]
