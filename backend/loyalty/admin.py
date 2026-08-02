from django.contrib import admin
from .models import LoyaltyTransaction, LoyaltyConfig


@admin.register(LoyaltyTransaction)
class LoyaltyTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'points', 'type', 'remaining', 'expires_at', 'description', 'created_at')
    list_filter = ('type',)
    search_fields = ('user__email', 'description')


@admin.register(LoyaltyConfig)
class LoyaltyConfigAdmin(admin.ModelAdmin):
    list_display = (
        'points_per_100_spent', 'point_value_rupees', 'validity_days', 'max_redeem_percent',
        'welcome_bonus_points', 'referral_bonus_points', 'birthday_bonus_points',
    )

    def has_add_permission(self, request):
        # Singleton config row - created lazily via LoyaltyConfig.get_config()
        return not LoyaltyConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
