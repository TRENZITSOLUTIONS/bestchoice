from django.urls import path
from . import views

urlpatterns = [
    path('products/<slug:product_slug>/reviews/', views.product_reviews, name='product-reviews'),
    path('reviews/mine/', views.my_reviews, name='my-reviews'),
]
