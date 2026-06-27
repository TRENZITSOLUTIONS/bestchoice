from django.urls import path
from . import views

urlpatterns = [
    path('wishlist/', views.wishlist_list, name='wishlist-list'),
    path('wishlist/<int:product_id>/', views.wishlist_remove, name='wishlist-remove'),
]
