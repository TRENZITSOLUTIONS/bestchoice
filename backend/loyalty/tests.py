from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from decimal import Decimal

from orders.models import Order
from .models import LoyaltyTransaction, LoyaltyConfig
from .utils import (
    earn_points, consume_points, reverse_earned_points, restore_used_points, expire_lapsed_points,
    points_for_order_subtotal, rupee_value_of_points, max_redeemable_points,
)

User = get_user_model()


class LoyaltyTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='loyalty@example.com', username='loyaltyuser', password='pass12345', phone='9999999999',
        )

    def make_order(self, order_id='BC-ORD-TEST-0001'):
        return Order.objects.create(
            order_id=order_id, user=self.user, subtotal=1000, total=1000,
            shipping_address={'pincode': '600001', 'state': 'Tamil Nadu'},
        )


class EarnPointsTest(LoyaltyTestCase):
    def test_earn_sets_remaining_and_expiry(self):
        txn = earn_points(self.user, 50, description='Order X')
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 50)
        self.assertEqual(txn.remaining, 50)
        expected_expiry = txn.created_at + timedelta(days=LoyaltyConfig.get_config().validity_days)
        self.assertAlmostEqual(txn.expires_at, expected_expiry, delta=timedelta(seconds=5))

    def test_zero_or_negative_amount_is_noop(self):
        self.assertIsNone(earn_points(self.user, 0))
        self.assertIsNone(earn_points(self.user, -10))
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 0)


class ConsumePointsTest(LoyaltyTestCase):
    def test_consumes_oldest_batch_first(self):
        older = earn_points(self.user, 30, description='older')
        LoyaltyTransaction.objects.filter(pk=older.pk).update(created_at=timezone.now() - timedelta(days=10))
        newer = earn_points(self.user, 30, description='newer')
        self.user.refresh_from_db()

        consumed = consume_points(self.user, 40, description='spend')
        self.assertEqual(consumed, 40)

        older.refresh_from_db()
        newer.refresh_from_db()
        self.assertEqual(older.remaining, 0)
        self.assertEqual(newer.remaining, 20)

        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 20)

    def test_does_not_consume_expired_batches(self):
        expired = earn_points(self.user, 50, description='old batch')
        LoyaltyTransaction.objects.filter(pk=expired.pk).update(expires_at=timezone.now() - timedelta(days=1))
        fresh = earn_points(self.user, 20, description='fresh batch')

        consumed = consume_points(self.user, 20, description='spend')
        self.assertEqual(consumed, 20)

        expired.refresh_from_db()
        fresh.refresh_from_db()
        self.assertEqual(expired.remaining, 50)
        self.assertEqual(fresh.remaining, 0)

    def test_consume_more_than_available_is_capped(self):
        earn_points(self.user, 10, description='only batch')
        consumed = consume_points(self.user, 999, description='overspend attempt')
        self.assertEqual(consumed, 10)
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 0)

    def test_zero_amount_is_noop(self):
        earn_points(self.user, 10)
        self.assertEqual(consume_points(self.user, 0), 0)


class OrderCancellationReversalTest(LoyaltyTestCase):
    def test_reverse_earned_points_zeroes_unspent_batch(self):
        order = self.make_order()
        earned = earn_points(self.user, 30, order=order, description='order earn')
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 30)

        reversed_amount = reverse_earned_points(self.user, order, description='cancelled')
        self.assertEqual(reversed_amount, 30)

        earned.refresh_from_db()
        self.assertEqual(earned.remaining, 0)
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 0)

    def test_reverse_earned_points_no_batch_for_order_is_noop(self):
        order = self.make_order()
        self.assertEqual(reverse_earned_points(self.user, order, description='cancelled'), 0)

    def test_restore_used_points_creates_fresh_spendable_batch(self):
        txn = restore_used_points(self.user, 25, description='refunded')
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 25)
        self.assertEqual(txn.remaining, 25)
        self.assertIsNotNone(txn.expires_at)


class ExpireLapsedPointsTest(LoyaltyTestCase):
    def test_expires_only_past_due_batches(self):
        lapsed = earn_points(self.user, 40, description='old')
        LoyaltyTransaction.objects.filter(pk=lapsed.pk).update(expires_at=timezone.now() - timedelta(days=1))
        active = earn_points(self.user, 15, description='still valid')
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 55)

        expired_count = expire_lapsed_points()
        self.assertEqual(expired_count, 1)

        lapsed.refresh_from_db()
        active.refresh_from_db()
        self.assertEqual(lapsed.remaining, 0)
        self.assertEqual(active.remaining, 15)

        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 15)
        self.assertTrue(
            LoyaltyTransaction.objects.filter(user=self.user, type='expired', points=-40).exists()
        )

    def test_only_expires_remaining_unspent_portion(self):
        batch = earn_points(self.user, 100, description='big batch')
        consume_points(self.user, 60, description='partial spend')
        LoyaltyTransaction.objects.filter(pk=batch.pk).update(expires_at=timezone.now() - timedelta(days=1))

        expire_lapsed_points()

        self.assertTrue(
            LoyaltyTransaction.objects.filter(user=self.user, type='expired', points=-40).exists()
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 0)

    def test_no_lapsed_batches_is_noop(self):
        earn_points(self.user, 10, description='fresh')
        self.assertEqual(expire_lapsed_points(), 0)


class LoyaltyConfigTest(LoyaltyTestCase):
    def test_defaults_match_documented_program(self):
        config = LoyaltyConfig.get_config()
        self.assertEqual(config.points_per_100_spent, 1)
        self.assertEqual(config.point_value_rupees, Decimal('1.00'))
        self.assertEqual(config.validity_days, 365)
        self.assertEqual(config.max_redeem_percent, 20)
        self.assertEqual(config.welcome_bonus_points, 50)
        self.assertEqual(config.referral_bonus_points, 50)
        self.assertEqual(config.birthday_bonus_points, 100)

    def test_get_config_is_a_singleton(self):
        first = LoyaltyConfig.get_config()
        second = LoyaltyConfig.get_config()
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(LoyaltyConfig.objects.count(), 1)

    def test_earn_rate_changes_with_config(self):
        config = LoyaltyConfig.get_config()
        config.points_per_100_spent = 5
        config.save()
        self.assertEqual(points_for_order_subtotal(Decimal('1000')), 50)

    def test_redemption_rate_changes_with_config(self):
        config = LoyaltyConfig.get_config()
        config.point_value_rupees = Decimal('2.00')
        config.save()
        self.assertEqual(rupee_value_of_points(10), Decimal('20.00'))

    def test_max_redeemable_changes_with_config(self):
        config = LoyaltyConfig.get_config()
        config.max_redeem_percent = 50
        config.point_value_rupees = Decimal('1.00')
        config.save()
        self.assertEqual(max_redeemable_points(Decimal('1000')), 500)

    def test_validity_days_changes_new_batch_expiry(self):
        config = LoyaltyConfig.get_config()
        config.validity_days = 30
        config.save()
        txn = earn_points(self.user, 10, description='short-lived batch')
        self.assertAlmostEqual(
            txn.expires_at, txn.created_at + timedelta(days=30), delta=timedelta(seconds=5),
        )

    def test_bonus_amounts_change_with_config(self):
        config = LoyaltyConfig.get_config()
        config.welcome_bonus_points = 200
        config.save()
        self.assertEqual(LoyaltyConfig.get_config().welcome_bonus_points, 200)
