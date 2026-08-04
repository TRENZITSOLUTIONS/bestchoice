from django.urls import path

from orders.views import admin_update_order_status, admin_update_refund_status
from products.views import admin_update_product

from . import staff_views

urlpatterns = [
    # Dashboard + reporting
    path('stats/', staff_views.dashboard_stats, name='admin-stats'),
    path('reports/', staff_views.reports, name='admin-reports'),

    # Orders
    path('orders/', staff_views.order_list, name='admin-order-list'),
    path('orders/bulk-ship/', staff_views.bulk_mark_shipped, name='admin-bulk-ship'),
    path('orders/<str:order_id>/status/', admin_update_order_status, name='admin-order-status'),

    # Refunds
    path('refunds/', staff_views.refund_list, name='admin-refund-list'),
    path('refunds/<int:refund_id>/status/', admin_update_refund_status, name='admin-refund-status'),

    # Catalogue
    path('inventory/', staff_views.inventory_list, name='admin-inventory'),
    path('products/<int:pk>/', admin_update_product, name='admin-product-update'),

    # Reviews
    path('reviews/', staff_views.review_queue, name='admin-review-queue'),
    path('reviews/<int:review_id>/moderate/', staff_views.review_moderate, name='admin-review-moderate'),

    # Coupons
    path('coupons/', staff_views.coupon_collection, name='admin-coupon-list'),
    path('coupons/<int:pk>/', staff_views.coupon_detail, name='admin-coupon-detail'),

    # Delivery
    path('pincodes/', staff_views.pincode_list, name='admin-pincode-list'),
    path('delivery-rates/', staff_views.delivery_rates, name='admin-delivery-rates'),
]
