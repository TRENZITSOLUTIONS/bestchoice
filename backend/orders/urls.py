from django.urls import path
from . import views

urlpatterns = [
    path('checkout/', views.checkout, name='checkout'),
    path('orders/', views.order_list, name='order-list'),
    path('orders/<str:order_id>/', views.order_detail, name='order-detail'),
    path('orders/<str:order_id>/cancel/', views.cancel_order, name='order-cancel'),
    path('orders/<str:order_id>/refund/', views.request_refund, name='order-refund'),
]
