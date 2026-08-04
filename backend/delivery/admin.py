from django.contrib import admin
from .models import DeliveryPincode, OutsideStateDeliveryRate, TamilNaduDeliveryRate


@admin.register(DeliveryPincode)
class DeliveryPincodeAdmin(admin.ModelAdmin):
    list_display = ('pincode', 'city', 'state', 'delivery_type', 'store_pickup_available', 'cod_available', 'is_active')
    list_filter = ('delivery_type', 'store_pickup_available', 'is_active')
    search_fields = ('pincode', 'city')


@admin.register(TamilNaduDeliveryRate)
class TamilNaduDeliveryRateAdmin(admin.ModelAdmin):
    list_display = ('local_charge', 'standard_charge', 'free_delivery_threshold',
                    'weight_surcharge_per_500g', 'weight_allowance_g')
    fieldsets = (
        ('Charge by rate zone', {
            'fields': ('local_charge', 'standard_charge'),
            'description': 'A pincode with its own delivery charge set overrides these.',
        }),
        ('Free delivery', {'fields': ('free_delivery_threshold',)}),
        ('Weight surcharge', {'fields': ('weight_surcharge_per_500g', 'weight_allowance_g')}),
        ('Customer-facing text', {'fields': ('estimated_days_text',)}),
    )

    def has_add_permission(self, request):
        # Singleton config row — created lazily via TamilNaduDeliveryRate.get_config()
        return not TamilNaduDeliveryRate.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(OutsideStateDeliveryRate)
class OutsideStateDeliveryRateAdmin(admin.ModelAdmin):
    list_display = ('base_charge', 'free_delivery_threshold', 'weight_surcharge_per_500g',
                    'estimated_days_text', 'cod_available', 'is_active')
    fieldsets = (
        ('Availability', {
            'fields': ('is_active',),
            'description': 'Turn off to reject orders outside Tamil Nadu at checkout.',
        }),
        ('Charges', {'fields': ('base_charge', 'free_delivery_threshold')}),
        ('Weight surcharge', {'fields': ('weight_surcharge_per_500g', 'weight_allowance_g')}),
        ('Customer-facing text', {'fields': ('estimated_days_text', 'cod_available')}),
    )

    def has_add_permission(self, request):
        # Singleton config row — created lazily via OutsideStateDeliveryRate.get_config()
        return not OutsideStateDeliveryRate.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
