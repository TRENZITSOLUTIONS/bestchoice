from django.urls import path
from . import views

urlpatterns = [
    path('cart/apply-coupon/', views.apply_coupon, name='apply-coupon'),
    path('cart/remove-coupon/', views.remove_coupon, name='remove-coupon'),
]
