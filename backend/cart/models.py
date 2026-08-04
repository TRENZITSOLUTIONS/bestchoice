from decimal import Decimal

from django.db import models
from django.conf import settings


class Cart(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    coupon = models.ForeignKey('coupons.Coupon', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Cart {self.id} - {self.user or self.session_id}'

    def get_subtotal(self):
        return sum((item.price * item.quantity for item in self.items.all()), Decimal('0'))

    def get_coupon_discount(self, subtotal=None):
        """Discount the applied coupon currently gives, or 0.

        Recomputed on every read rather than stored, so removing items from the
        cart correctly drops the discount when the coupon stops qualifying.
        """
        if not self.coupon_id:
            return Decimal('0')

        from coupons.utils import CouponError, check_coupon

        subtotal = self.get_subtotal() if subtotal is None else subtotal
        try:
            return check_coupon(self.coupon, subtotal, self.user)
        except CouponError:
            return Decimal('0')


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    variant = models.ForeignKey('products.ProductVariant', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.product.name} x {self.quantity}'
