from django.urls import path
from . import views

urlpatterns = [
    path('loyalty/balance/', views.loyalty_balance, name='loyalty-balance'),
    path('loyalty/transactions/', views.loyalty_transactions, name='loyalty-transactions'),
]
