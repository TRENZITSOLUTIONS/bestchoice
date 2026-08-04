from django.contrib import admin

from .models import AnnouncementMessage


@admin.register(AnnouncementMessage)
class AnnouncementMessageAdmin(admin.ModelAdmin):
    list_display = ('text', 'sort_order', 'is_active')
    list_editable = ('sort_order', 'is_active')
    ordering = ('sort_order', 'id')
