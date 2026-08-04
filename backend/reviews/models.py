from django.db import models
from django.db.models import Q
from django.conf import settings


class ReviewConfig(models.Model):
    """Singleton config for review moderation - editable in Django Admin,
    no code changes/deploys needed to switch moderation on or off."""

    auto_approve_reviews = models.BooleanField(
        default=True,
        help_text='On: new reviews go live immediately. Off: every new review is '
                  'held as pending and only appears on the product page once staff '
                  'approve it in the Reviews list.')

    class Meta:
        verbose_name = 'Review moderation configuration'
        verbose_name_plural = 'Review moderation configuration'

    def __str__(self):
        return 'Review moderation configuration'

    @classmethod
    def get_config(cls):
        config = cls.objects.first()
        if config is None:
            config = cls.objects.create()
        return config


def find_verifying_order(user, product):
    """The user's most recent order that proves they actually bought this product,
    or None. Used to stamp is_verified_purchase on a new review.

    An order counts once it is delivered, or - for orders still in transit - once
    payment has gone through. Cancelled orders never count, even if they were paid
    and then refunded, since the customer never received the goods.
    """
    from orders.models import Order

    return (
        Order.objects
        .filter(user=user, items__product=product)
        .filter(Q(status='delivered') | Q(payment_status='paid'))
        .exclude(status='cancelled')
        .order_by('-created_at')
        .distinct()
        .first()
    )


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='reviews')
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    text = models.TextField(blank=True)
    images = models.JSONField(default=list, blank=True)
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'product')

    def __str__(self):
        return f'{self.user} - {self.product.name} - {self.rating}★'
