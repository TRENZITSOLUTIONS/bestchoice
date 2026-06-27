from django.contrib import admin
from .models import LoyaltyTransaction


@admin.register(LoyaltyTransaction)
class LoyaltyTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'points', 'type', 'description', 'created_at')
    list_filter = ('type',)
    search_fields = ('user__email', 'description')
