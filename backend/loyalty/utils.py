from django.db.models import Q
from django.utils import timezone

from .models import LoyaltyTransaction, LoyaltyConfig


def points_for_order_subtotal(subtotal):
    """How many points an order subtotal earns, per the configured rate."""
    config = LoyaltyConfig.get_config()
    return int(subtotal / 100) * config.points_per_100_spent


def rupee_value_of_points(points):
    """Rupee discount `points` are worth when redeemed, per the configured rate."""
    return LoyaltyConfig.get_config().point_value_rupees * points


def max_redeemable_points(subtotal):
    """Max points spendable on a single order (config'd % of subtotal), in points -
    not rupees, so it can be compared directly against a user's points balance."""
    config = LoyaltyConfig.get_config()
    max_rupees = subtotal * config.max_redeem_percent / 100
    if config.point_value_rupees <= 0:
        return 0
    return int(max_rupees / config.point_value_rupees)


def earn_points(user, amount, order=None, description=''):
    """Credit a new, independently-expiring batch of points."""
    if amount <= 0:
        return None
    transaction = LoyaltyTransaction.objects.create(
        user=user, points=amount, type='earned', order=order, description=description,
    )
    user.loyalty_points += amount
    user.save(update_fields=['loyalty_points'])
    return transaction


def _active_batches(user):
    unexpired = Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
    return LoyaltyTransaction.objects.filter(user=user, remaining__gt=0).filter(unexpired).order_by('created_at')


def consume_points(user, amount, order=None, description=''):
    """Spend points FIFO across active (unexpired) batches - oldest first, so points
    actually in danger of lapsing get used before newer ones."""
    if amount <= 0:
        return 0

    remaining_to_consume = amount
    for batch in _active_batches(user):
        if remaining_to_consume <= 0:
            break
        take = min(batch.remaining, remaining_to_consume)
        batch.remaining -= take
        batch.save(update_fields=['remaining'])
        remaining_to_consume -= take

    consumed = amount - remaining_to_consume
    if consumed > 0:
        LoyaltyTransaction.objects.create(
            user=user, points=-consumed, type='spent', order=order, description=description,
        )
        user.loyalty_points = max(0, user.loyalty_points - consumed)
        user.save(update_fields=['loyalty_points'])
    return consumed


def reverse_earned_points(user, order, description=''):
    """Order cancelled - the batch it earned no longer counts. Zeroes out whatever
    of that batch is still unspent and logs a matching deduction."""
    batch = LoyaltyTransaction.objects.filter(user=user, order=order, type='earned').first()
    if not batch or batch.remaining <= 0:
        return 0

    reversed_amount = batch.remaining
    batch.remaining = 0
    batch.save(update_fields=['remaining'])

    LoyaltyTransaction.objects.create(
        user=user, points=-reversed_amount, type='refund', order=order, description=description,
    )
    user.loyalty_points = max(0, user.loyalty_points - reversed_amount)
    user.save(update_fields=['loyalty_points'])
    return reversed_amount


def restore_used_points(user, amount, order=None, description=''):
    """Order cancelled after points were redeemed on it - give them back as a fresh
    batch (its own new 12-month window), same as any other earn."""
    if amount <= 0:
        return None
    transaction = LoyaltyTransaction.objects.create(
        user=user, points=amount, type='refund', order=order, description=description,
    )
    user.loyalty_points += amount
    user.save(update_fields=['loyalty_points'])
    return transaction


def expire_lapsed_points():
    """Zero out and log every batch whose 12-month window has passed. Meant to be
    run periodically (see the expire_loyalty_points management command)."""
    lapsed = LoyaltyTransaction.objects.filter(
        remaining__gt=0, expires_at__isnull=False, expires_at__lte=timezone.now(),
    ).select_related('user')

    expired_count = 0
    for batch in lapsed:
        amount = batch.remaining
        batch.remaining = 0
        batch.save(update_fields=['remaining'])

        LoyaltyTransaction.objects.create(
            user=batch.user, points=-amount, type='expired', order=batch.order,
            description=f'{amount} pts earned {batch.created_at.date()} expired',
        )
        batch.user.loyalty_points = max(0, batch.user.loyalty_points - amount)
        batch.user.save(update_fields=['loyalty_points'])
        expired_count += 1

    return expired_count
