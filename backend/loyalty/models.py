from datetime import timedelta

from django.db import models
from django.conf import settings

POINTS_VALIDITY_DAYS = 365


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
            self.remaining = self.points
            self.expires_at = self.created_at + timedelta(days=POINTS_VALIDITY_DAYS)
            super().save(update_fields=['remaining', 'expires_at'])

    def __str__(self):
        return f'{self.user} {self.type} {self.points}pts'
