from decimal import ROUND_HALF_UP, Decimal

from django.utils import timezone

from .models import CouponUsage

PAISE = Decimal('0.01')


def to_money(value):
    """Round to paise. Percentage maths yields long tails like 389.7000."""
    return Decimal(value).quantize(PAISE, rounding=ROUND_HALF_UP)


class CouponError(Exception):
    """A coupon exists but cannot be used right now."""

    def __init__(self, message, code):
        self.message = message
        self.code = code
        super().__init__(message)


def compute_discount(coupon, subtotal):
    """Rupee discount this coupon gives on `subtotal`, never more than the subtotal."""
    if coupon.discount_type == 'percentage':
        discount = subtotal * coupon.discount_value / Decimal(100)
        if coupon.max_discount:
            discount = min(discount, coupon.max_discount)
    else:
        discount = coupon.discount_value
    return to_money(min(discount, subtotal))


def check_coupon(coupon, subtotal, user=None):
    """Validate a coupon against a cart subtotal and return its discount.

    Raises CouponError. Used by apply-coupon, by the cart serializer on every
    read (so a coupon stops discounting if items are removed and the cart drops
    below min_cart_value), and again at checkout - the cart can change between
    applying and paying, so the discount is always recomputed, never trusted.
    """
    now = timezone.now()

    if not coupon.is_active:
        raise CouponError('This coupon is no longer active', 'INACTIVE')
    if now < coupon.valid_from or now > coupon.valid_till:
        raise CouponError('This coupon has expired', 'EXPIRED')
    if coupon.usage_limit > 0 and coupon.used_count >= coupon.usage_limit:
        raise CouponError('This coupon has reached its usage limit', 'LIMIT_REACHED')
    if subtotal < coupon.min_cart_value:
        raise CouponError(
            f'Minimum cart value ₹{coupon.min_cart_value} required', 'MIN_CART'
        )

    if user is not None and getattr(user, 'is_authenticated', False):
        used = CouponUsage.objects.filter(coupon=coupon, user=user).count()
        if coupon.per_user_limit > 0 and used >= coupon.per_user_limit:
            raise CouponError('You have already used this coupon', 'ALREADY_USED')

    return compute_discount(coupon, subtotal)


def record_usage(coupon, user, order):
    """Consume one use of the coupon. Called once, when an order is created.

    Deliberately not called at apply time: doing so burned the coupon for anyone
    who applied a code and then abandoned their cart, and with per_user_limit=1
    locked them out of it permanently without ever giving them the discount.
    """
    coupon.used_count = coupon.used_count + 1
    coupon.save(update_fields=['used_count'])
    CouponUsage.objects.get_or_create(coupon=coupon, user=user, order=order)


def release_usage(coupon, user, order):
    """Give a consumed use back, e.g. when the order is cancelled or refunded."""
    deleted, _ = CouponUsage.objects.filter(coupon=coupon, user=user, order=order).delete()
    if deleted and coupon.used_count > 0:
        coupon.used_count = coupon.used_count - 1
        coupon.save(update_fields=['used_count'])


def _trim(value):
    """15.00 -> '15', 12.50 -> '12.5' - Decimal's 'g' format keeps the zeros."""
    trimmed = Decimal(value).normalize()
    # normalize() turns 1500 into 1.5E+3, so expand any positive exponent back out.
    if trimmed == trimmed.to_integral_value():
        return str(trimmed.quantize(Decimal(1)))
    return str(trimmed)


def discount_label(coupon):
    if coupon.discount_type == 'percentage':
        return f'{_trim(coupon.discount_value)}% off'
    return f'₹{_trim(coupon.discount_value)} off'


def serialize_coupon(coupon):
    return {
        'code': coupon.code,
        'discount_type': coupon.discount_type,
        'discount_value': str(coupon.discount_value),
        'max_discount': str(coupon.max_discount) if coupon.max_discount else None,
        'label': discount_label(coupon),
    }
