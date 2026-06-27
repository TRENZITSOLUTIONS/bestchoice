from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'phone', 'username', 'is_active', 'is_staff', 'loyalty_points')
    list_filter = ('is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'phone', 'username')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Extra', {'fields': ('phone', 'loyalty_points')}),
    )
