from django.urls import path
from . import views

urlpatterns = [
    path('cart/', views.cart_detail, name='cart-detail'),
    path('cart/items/', views.cart_add_item, name='cart-add-item'),
    path('cart/items/<int:item_id>/', views.cart_item_detail, name='cart-item-detail'),
]
