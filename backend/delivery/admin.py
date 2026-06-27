from django.contrib import admin
from .models import DeliveryPincode


@admin.register(DeliveryPincode)
class DeliveryPincodeAdmin(admin.ModelAdmin):
    list_display = ('pincode', 'city', 'state', 'delivery_type', 'store_pickup_available', 'cod_available', 'is_active')
    list_filter = ('delivery_type', 'store_pickup_available', 'is_active')
    search_fields = ('pincode', 'city')
