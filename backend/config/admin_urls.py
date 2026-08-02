from django.urls import path
from orders.views import admin_update_order_status, admin_update_refund_status
from products.views import admin_update_product

urlpatterns = [
    path('orders/<str:order_id>/status/', admin_update_order_status, name='admin-order-status'),
    path('refunds/<int:refund_id>/status/', admin_update_refund_status, name='admin-refund-status'),
    path('products/<int:pk>/', admin_update_product, name='admin-product-update'),
]
