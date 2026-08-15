from django.urls import path

from orders.views import admin_update_order_status, admin_update_refund_status
from products.views import (
    admin_create_product, admin_update_product, admin_product_bulk_action,
    admin_product_images, admin_product_image_detail,
    admin_product_variants, admin_product_variant_detail,
    admin_category_collection, admin_category_detail, admin_category_image,
    admin_brand_collection, admin_brand_detail,
)

from . import staff_views

urlpatterns = [
    # Dashboard + reporting
    path('stats/', staff_views.dashboard_stats, name='admin-stats'),
    path('reports/', staff_views.reports, name='admin-reports'),

    # Orders
    path('orders/', staff_views.order_list, name='admin-order-list'),
    path('orders/bulk-ship/', staff_views.bulk_mark_shipped, name='admin-bulk-ship'),
    path('orders/<str:order_id>/', staff_views.order_detail, name='admin-order-detail'),
    path('orders/<str:order_id>/status/', admin_update_order_status, name='admin-order-status'),

    # Refunds
    path('refunds/', staff_views.refund_list, name='admin-refund-list'),
    path('refunds/<int:refund_id>/status/', admin_update_refund_status, name='admin-refund-status'),

    # Catalogue
    path('inventory/', staff_views.inventory_list, name='admin-inventory'),
    path('products/', admin_create_product, name='admin-product-create'),
    path('products/bulk-action/', admin_product_bulk_action, name='admin-product-bulk-action'),
    path('products/<int:pk>/', admin_update_product, name='admin-product-update'),
    path('products/<int:product_id>/images/', admin_product_images, name='admin-product-images'),
    path('products/<int:product_id>/images/<int:image_id>/', admin_product_image_detail, name='admin-product-image-detail'),
    path('products/<int:product_id>/variants/', admin_product_variants, name='admin-product-variants'),
    path('products/<int:product_id>/variants/<int:variant_id>/', admin_product_variant_detail, name='admin-product-variant-detail'),
    path('categories/', admin_category_collection, name='admin-category-list'),
    path('categories/<int:pk>/', admin_category_detail, name='admin-category-detail'),
    path('categories/<int:pk>/image/', admin_category_image, name='admin-category-image'),
    path('brands/', admin_brand_collection, name='admin-brand-list'),
    path('brands/<int:pk>/', admin_brand_detail, name='admin-brand-detail'),

    # Reviews
    path('reviews/', staff_views.review_queue, name='admin-review-queue'),
    path('reviews/<int:review_id>/moderate/', staff_views.review_moderate, name='admin-review-moderate'),

    # Coupons
    path('coupons/', staff_views.coupon_collection, name='admin-coupon-list'),
    path('coupons/<int:pk>/', staff_views.coupon_detail, name='admin-coupon-detail'),

    # Delivery
    path('pincodes/', staff_views.pincode_list, name='admin-pincode-list'),
    path('delivery-rates/', staff_views.delivery_rates, name='admin-delivery-rates'),
    path('delivery-rates/tamil-nadu/', staff_views.update_tamil_nadu_rate, name='admin-delivery-rate-tn'),
    path('delivery-rates/outside-tamil-nadu/', staff_views.update_outside_state_rate, name='admin-delivery-rate-outside'),
]
