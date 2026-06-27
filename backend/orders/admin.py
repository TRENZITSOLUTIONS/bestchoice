from django.contrib import admin
from .models import Order, OrderItem, Refund


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_snapshot',)


class RefundInline(admin.TabularInline):
    model = Refund
    extra = 0
    readonly_fields = ('razorpay_refund_id',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'user', 'total', 'status', 'payment_status', 'delivery_type', 'created_at')
    list_filter = ('status', 'payment_status', 'delivery_type')
    search_fields = ('order_id', 'user__email', 'user__phone')
    inlines = [OrderItemInline, RefundInline]
    readonly_fields = ('razorpay_order_id', 'razorpay_payment_id')


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'amount', 'status', 'created_at')
    list_filter = ('status',)
