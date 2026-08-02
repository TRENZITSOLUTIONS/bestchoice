from django.contrib import admin
from .models import DeliveryPincode, OutsideStateDeliveryRate


@admin.register(DeliveryPincode)
class DeliveryPincodeAdmin(admin.ModelAdmin):
    list_display = ('pincode', 'city', 'state', 'delivery_type', 'store_pickup_available', 'cod_available', 'is_active')
    list_filter = ('delivery_type', 'store_pickup_available', 'is_active')
    search_fields = ('pincode', 'city')


@admin.register(OutsideStateDeliveryRate)
class OutsideStateDeliveryRateAdmin(admin.ModelAdmin):
    list_display = ('base_charge', 'free_delivery_threshold', 'estimated_days_text', 'cod_available', 'is_active')

    def has_add_permission(self, request):
        # Singleton config row — created lazily via OutsideStateDeliveryRate.get_config()
        return not OutsideStateDeliveryRate.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
