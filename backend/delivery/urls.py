from django.urls import path
from . import views

urlpatterns = [
    path('delivery/check/<str:pincode>/', views.check_pincode, name='delivery-check'),
]
