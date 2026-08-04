from django.contrib import admin
from .models import Review, ReviewConfig


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'rating', 'is_verified_purchase', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'is_verified_purchase', 'rating')
    search_fields = ('user__email', 'product__name')
    actions = ['approve_reviews', 'reject_reviews']

    def approve_reviews(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} review(s) approved and now visible on the product page.')
    approve_reviews.short_description = 'Approve selected reviews'

    def reject_reviews(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} review(s) rejected and hidden from the product page.')
    reject_reviews.short_description = 'Reject selected reviews (hide from product page)'


@admin.register(ReviewConfig)
class ReviewConfigAdmin(admin.ModelAdmin):
    list_display = ('auto_approve_reviews',)

    def has_add_permission(self, request):
        # Singleton config row - created lazily via ReviewConfig.get_config()
        return not ReviewConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
