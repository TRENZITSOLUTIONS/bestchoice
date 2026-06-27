from django.contrib import admin
from .models import Coupon, CouponUsage


class CouponUsageInline(admin.TabularInline):
    model = CouponUsage
    extra = 0
    readonly_fields = ('user', 'order', 'used_at')


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'min_cart_value', 'used_count', 'usage_limit', 'valid_till', 'is_active')
    list_filter = ('is_active', 'discount_type')
    search_fields = ('code',)
    inlines = [CouponUsageInline]
