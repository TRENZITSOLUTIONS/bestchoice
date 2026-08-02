from datetime import timedelta
from decimal import Decimal

from django.db import models
from django.conf import settings


class LoyaltyConfig(models.Model):
    """Singleton config for the whole loyalty program - editable in Django Admin,
    no code changes/deploys needed to retune rates."""

    points_per_100_spent = models.PositiveIntegerField(
        default=1, help_text='Points earned per Rs.100 of order subtotal')
    point_value_rupees = models.DecimalField(
        max_digits=6, decimal_places=2, default=Decimal('1.00'),
        help_text='Rupee value of 1 point when redeemed at checkout')
    validity_days = models.PositiveIntegerField(
        default=365, help_text='Days after earning before a batch of points expires')
    max_redeem_percent = models.PositiveIntegerField(
        default=20, help_text='Max % of order subtotal payable with points, per order')
    welcome_bonus_points = models.PositiveIntegerField(default=50)
    referral_bonus_points = models.PositiveIntegerField(
        default=50, help_text='Given to both the referrer and the new user')
    birthday_bonus_points = models.PositiveIntegerField(default=100)
    expiring_soon_window_days = models.PositiveIntegerField(
        default=30, help_text='Window used for the "expiring soon" balance warning')

    class Meta:
        verbose_name = 'Loyalty program configuration'
        verbose_name_plural = 'Loyalty program configuration'

    def __str__(self):
        return 'Loyalty program configuration'

    @classmethod
    def get_config(cls):
        config = cls.objects.first()
        if config is None:
            config = cls.objects.create()
        return config


class LoyaltyTransaction(models.Model):
    TYPES = [
        ('earned', 'Earned'),
        ('spent', 'Spent'),
        ('expired', 'Expired'),
        ('refund', 'Refund'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loyalty_transactions')
    points = models.IntegerField()
    type = models.CharField(max_length=10, choices=TYPES)
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    # Only meaningful for positive-points batches (earned, or a refund crediting
    # points back) - how many of THIS batch's points are still unspent/unexpired,
    # and when the batch lapses. Consumption (spend/expiry) is tracked per-batch
    # here rather than as a single running total, so points can actually expire
    # 12 months after they were earned instead of all-or-nothing.
    remaining = models.IntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new and self.points > 0 and self.remaining == 0:
            validity_days = LoyaltyConfig.get_config().validity_days
            self.remaining = self.points
            self.expires_at = self.created_at + timedelta(days=validity_days)
            super().save(update_fields=['remaining', 'expires_at'])

    def __str__(self):
        return f'{self.user} {self.type} {self.points}pts'
