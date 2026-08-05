"""Tests for the staff dashboard API under /api/admin/."""
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from coupons.models import Coupon
from delivery.models import DeliveryPincode
from orders.models import Order, OrderItem, Refund
from products.models import Brand, Category, Product, ProductVariant
from reviews.models import Review

User = get_user_model()


class StaffApiTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.customer = User.objects.create_user(
            email='shopper@example.com', username='shopper', password='pw123456',
        )
        self.staff = User.objects.create_user(
            email='manager@bestchoice.in', username='manager',
            password='pw123456', is_staff=True,
        )

        self.category = Category.objects.create(name='Shirts', slug='shirts')
        self.brand = Brand.objects.create(name='BestChoice', slug='bestchoice')
        self.product = Product.objects.create(
            name='Cotton Shirt', slug='cotton-shirt', category=self.category,
            brand=self.brand, mrp=1999, selling_price=1000,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product, color='Red', size='M', stock=8,
        )
        DeliveryPincode.objects.create(
            pincode='600001', city='Chennai', delivery_type='local',
            estimated_days_text='2-4 business days',
        )

    def as_staff(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(self.staff).access_token}')

    def as_customer(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(self.customer).access_token}')

    def make_order(self, total='1000', payment_status='paid', order_status='confirmed',
                   delivery_type='home', days_ago=0):
        order = Order.objects.create(
            order_id=f'BC-ORD-T-{Order.objects.count() + 1:04d}',
            user=self.customer, subtotal=Decimal(total), total=Decimal(total),
            status=order_status, payment_status=payment_status,
            shipping_address={'pincode': '600001', 'state': 'Tamil Nadu'},
            delivery_type=delivery_type,
        )
        if days_ago:
            stamp = timezone.now() - timedelta(days=days_ago)
            Order.objects.filter(pk=order.pk).update(created_at=stamp)
            order.refresh_from_db()
        OrderItem.objects.create(
            order=order, product=self.product, variant=self.variant,
            product_snapshot={'name': self.product.name}, quantity=2,
            price=Decimal(total) / 2,
        )
        return order


class StaffApiPermissionTest(StaffApiTestCase):
    """Every staff endpoint must be closed to customers and to anonymous callers."""

    ENDPOINTS = [
        ('get', '/api/admin/stats/'),
        ('get', '/api/admin/reports/'),
        ('get', '/api/admin/orders/'),
        ('post', '/api/admin/orders/bulk-ship/'),
        ('get', '/api/admin/refunds/'),
        ('get', '/api/admin/inventory/'),
        ('get', '/api/admin/reviews/'),
        ('get', '/api/admin/coupons/'),
        ('post', '/api/admin/coupons/'),
        ('get', '/api/admin/pincodes/'),
        ('get', '/api/admin/delivery-rates/'),
        ('patch', '/api/admin/delivery-rates/tamil-nadu/'),
        ('patch', '/api/admin/delivery-rates/outside-tamil-nadu/'),
    ]

    def test_customer_forbidden(self):
        self.as_customer()
        for method, url in self.ENDPOINTS:
            res = getattr(self.client, method)(url, {}, format='json')
            self.assertEqual(res.status_code, 403, f'{url} allowed a customer')

    def test_anonymous_unauthorized(self):
        self.client.credentials()
        for method, url in self.ENDPOINTS:
            res = getattr(self.client, method)(url, {}, format='json')
            self.assertEqual(res.status_code, 401, f'{url} allowed anonymous access')

    def test_staff_allowed(self):
        self.as_staff()
        for method, url in self.ENDPOINTS:
            res = getattr(self.client, method)(url, {}, format='json')
            self.assertNotIn(res.status_code, (401, 403), f'{url} rejected staff')


class DashboardStatsTest(StaffApiTestCase):
    def test_revenue_excludes_unpaid_and_cancelled(self):
        self.make_order(total='1000', payment_status='paid')
        self.make_order(total='500', payment_status='pending')
        self.make_order(total='700', payment_status='paid', order_status='cancelled')

        self.as_staff()
        data = self.client.get('/api/admin/stats/').data

        self.assertEqual(Decimal(data['revenue_total']), Decimal('1000'))
        self.assertEqual(data['orders_total'], 3)

    def test_sales_chart_is_zero_filled_for_the_window(self):
        self.make_order(total='300', days_ago=2)
        self.as_staff()
        data = self.client.get('/api/admin/stats/?days=7').data

        self.assertEqual(len(data['sales_chart']), 7)
        self.assertEqual(data['sales_chart'][-1]['date'], timezone.now().date().isoformat())
        self.assertEqual(sum(Decimal(d['revenue']) for d in data['sales_chart']), Decimal('300'))

    def test_counts_surface_work_waiting(self):
        self.make_order(order_status='pending')
        Review.objects.create(product=self.product, user=self.customer,
                              rating=4, text='ok', is_approved=False)
        self.as_staff()
        data = self.client.get('/api/admin/stats/').data

        self.assertEqual(data['orders_awaiting_action'], 1)
        self.assertEqual(data['reviews_pending'], 1)
        self.assertEqual(data['products_out_of_stock'], 0)

    def test_days_parameter_is_clamped_and_survives_junk(self):
        self.as_staff()
        self.assertEqual(self.client.get('/api/admin/stats/?days=9999').data['period_days'], 365)
        self.assertEqual(self.client.get('/api/admin/stats/?days=0').data['period_days'], 1)
        self.assertEqual(self.client.get('/api/admin/stats/?days=abc').data['period_days'], 7)


class ReportsTest(StaffApiTestCase):
    def test_top_products_and_category_revenue(self):
        self.make_order(total='1000')
        self.as_staff()
        data = self.client.get('/api/admin/reports/').data

        self.assertEqual(data['top_products'][0]['slug'], 'cotton-shirt')
        self.assertEqual(data['top_products'][0]['units'], 2)
        self.assertEqual(data['revenue_by_category'][0]['category'], 'Shirts')

    def test_delivery_type_split(self):
        self.make_order(delivery_type='home')
        self.make_order(delivery_type='store_pickup')
        self.as_staff()
        rows = {r['delivery_type']: r for r in self.client.get('/api/admin/reports/').data['by_delivery_type']}
        self.assertEqual(rows['home']['orders'], 1)
        self.assertEqual(rows['store_pickup']['orders'], 1)


class StaffOrderListTest(StaffApiTestCase):
    def test_lists_all_customers_orders(self):
        self.make_order()
        other = User.objects.create_user(email='b@example.com', username='b')
        Order.objects.create(
            order_id='BC-ORD-T-OTHER', user=other, subtotal=1, total=1,
            shipping_address={}, status='pending', payment_status='pending',
        )
        self.as_staff()
        self.assertEqual(self.client.get('/api/admin/orders/').data['count'], 2)

    def test_filters_and_search(self):
        paid = self.make_order(payment_status='paid')
        self.make_order(payment_status='pending')
        self.as_staff()

        self.assertEqual(self.client.get('/api/admin/orders/?payment_status=paid').data['count'], 1)
        self.assertEqual(
            self.client.get(f'/api/admin/orders/?search={paid.order_id}').data['count'], 1)
        self.assertEqual(
            self.client.get('/api/admin/orders/?search=shopper@example.com').data['count'], 2)

    def test_pagination_metadata(self):
        for _ in range(3):
            self.make_order()
        self.as_staff()
        data = self.client.get('/api/admin/orders/?page_size=2').data
        self.assertEqual((data['count'], data['num_pages'], len(data['results'])), (3, 2, 2))


class BulkShipTest(StaffApiTestCase):
    def test_marks_orders_shipped_and_logs_history(self):
        a, b = self.make_order(), self.make_order()
        self.as_staff()
        res = self.client.post('/api/admin/orders/bulk-ship/', {
            'order_ids': [a.order_id, b.order_id],
            'tracking_provider': 'Delhivery',
        }, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertCountEqual(res.data['updated'], [a.order_id, b.order_id])
        a.refresh_from_db()
        self.assertEqual(a.status, 'shipped')
        self.assertEqual(a.tracking_provider, 'Delhivery')
        self.assertTrue(a.status_history.filter(status='shipped').exists())

    def test_skips_orders_that_cannot_ship(self):
        delivered = self.make_order(order_status='delivered')
        cancelled = self.make_order(order_status='cancelled')
        self.as_staff()
        res = self.client.post('/api/admin/orders/bulk-ship/', {
            'order_ids': [delivered.order_id, cancelled.order_id, 'BC-ORD-NOPE'],
        }, format='json')

        self.assertEqual(res.data['updated'], [])
        reasons = {r['order_id']: r['reason'] for r in res.data['skipped']}
        self.assertEqual(reasons[delivered.order_id], 'already delivered')
        self.assertEqual(reasons['BC-ORD-NOPE'], 'not found')

    def test_rejects_one_tracking_id_across_many_orders(self):
        a, b = self.make_order(), self.make_order()
        self.as_staff()
        res = self.client.post('/api/admin/orders/bulk-ship/', {
            'order_ids': [a.order_id, b.order_id], 'tracking_id': 'ONE-PARCEL',
        }, format='json')

        self.assertEqual(res.status_code, 400)
        a.refresh_from_db()
        self.assertEqual(a.status, 'confirmed')

    def test_requires_a_non_empty_list(self):
        self.as_staff()
        self.assertEqual(
            self.client.post('/api/admin/orders/bulk-ship/', {'order_ids': []},
                             format='json').status_code, 400)


class InventoryTest(StaffApiTestCase):
    def test_flags_stock_state_worst_first(self):
        low = Product.objects.create(name='Low', slug='low', category=self.category,
                                     mrp=100, selling_price=90)
        ProductVariant.objects.create(product=low, color='B', size='S', stock=2)
        Product.objects.create(name='Zero', slug='zero', category=self.category,
                               mrp=100, selling_price=90, total_stock=0)
        plenty = Product.objects.create(name='Plenty', slug='plenty', category=self.category,
                                        mrp=100, selling_price=90)
        ProductVariant.objects.create(product=plenty, color='C', size='L', stock=50)

        self.as_staff()
        data = self.client.get('/api/admin/inventory/').data
        states = {r['name']: r['stock_state'] for r in data['results']}

        self.assertEqual(states['Zero'], 'out')
        self.assertEqual(states['Low'], 'low')
        self.assertEqual(states['Cotton Shirt'], 'low')  # 8, under the default threshold of 10
        self.assertEqual(states['Plenty'], 'ok')
        self.assertEqual(data['results'][0]['name'], 'Zero')  # worst first
        self.assertEqual(data['out_of_stock_count'], 1)

    def test_low_stock_threshold_is_configurable(self):
        self.as_staff()
        data = self.client.get('/api/admin/inventory/?low_stock_below=5').data
        states = {r['name']: r['stock_state'] for r in data['results']}
        self.assertEqual(states['Cotton Shirt'], 'ok')  # 8 is fine below a threshold of 5

    def test_out_of_stock_filter(self):
        Product.objects.create(name='Zero', slug='zero', category=self.category,
                               mrp=100, selling_price=90, total_stock=0)
        self.as_staff()
        data = self.client.get('/api/admin/inventory/?out_of_stock=true').data
        self.assertEqual([r['name'] for r in data['results']], ['Zero'])


class ReviewQueueTest(StaffApiTestCase):
    def setUp(self):
        super().setUp()
        self.review = Review.objects.create(
            product=self.product, user=self.customer, rating=3,
            text='Needs moderation', is_approved=False,
        )

    def test_pending_filter_and_count(self):
        self.as_staff()
        data = self.client.get('/api/admin/reviews/?pending=true').data
        self.assertEqual(data['pending_count'], 1)
        self.assertEqual(data['results'][0]['text'], 'Needs moderation')

    def test_approve_and_reject(self):
        self.as_staff()
        url = f'/api/admin/reviews/{self.review.id}/moderate/'

        self.assertTrue(self.client.post(url, {'action': 'approve'}, format='json').data['is_approved'])
        self.review.refresh_from_db()
        self.assertTrue(self.review.is_approved)

        self.assertFalse(self.client.post(url, {'action': 'reject'}, format='json').data['is_approved'])
        self.review.refresh_from_db()
        self.assertFalse(self.review.is_approved)

    def test_bad_action_and_missing_review(self):
        self.as_staff()
        self.assertEqual(self.client.post(
            f'/api/admin/reviews/{self.review.id}/moderate/', {'action': 'burn'},
            format='json').status_code, 400)
        self.assertEqual(self.client.post(
            '/api/admin/reviews/999999/moderate/', {'action': 'approve'},
            format='json').status_code, 404)


class CouponAdminTest(StaffApiTestCase):
    def payload(self, **overrides):
        data = {
            'code': 'diwali25',
            'discount_type': 'percentage',
            'discount_value': '25',
            'min_cart_value': '999',
            'valid_from': timezone.now().isoformat(),
            'valid_till': (timezone.now() + timedelta(days=30)).isoformat(),
            'usage_limit': 100,
            'per_user_limit': 1,
        }
        data.update(overrides)
        return data

    def test_create_uppercases_the_code(self):
        self.as_staff()
        res = self.client.post('/api/admin/coupons/', self.payload(), format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['code'], 'DIWALI25')

    def test_rejects_percentage_over_100(self):
        self.as_staff()
        res = self.client.post('/api/admin/coupons/',
                               self.payload(discount_value='150'), format='json')
        self.assertEqual(res.status_code, 400)

    def test_rejects_end_before_start(self):
        self.as_staff()
        res = self.client.post('/api/admin/coupons/', self.payload(
            valid_from=(timezone.now() + timedelta(days=5)).isoformat(),
            valid_till=timezone.now().isoformat(),
        ), format='json')
        self.assertEqual(res.status_code, 400)

    def test_rejects_zero_discount(self):
        self.as_staff()
        self.assertEqual(self.client.post('/api/admin/coupons/',
                                          self.payload(discount_value='0'),
                                          format='json').status_code, 400)

    def test_list_reports_usage(self):
        Coupon.objects.create(
            code='USED', discount_type='fixed', discount_value=100,
            valid_from=timezone.now() - timedelta(days=1),
            valid_till=timezone.now() + timedelta(days=1), used_count=4,
        )
        self.as_staff()
        row = next(r for r in self.client.get('/api/admin/coupons/').data['results']
                   if r['code'] == 'USED')
        self.assertEqual(row['used_count'], 4)

    def test_patch_updates_and_delete_deactivates(self):
        coupon = Coupon.objects.create(
            code='TWEAK', discount_type='fixed', discount_value=50,
            valid_from=timezone.now() - timedelta(days=1),
            valid_till=timezone.now() + timedelta(days=1),
        )
        self.as_staff()
        url = f'/api/admin/coupons/{coupon.id}/'

        self.assertEqual(self.client.patch(url, {'discount_value': '75'},
                                           format='json').status_code, 200)
        coupon.refresh_from_db()
        self.assertEqual(coupon.discount_value, Decimal('75'))

        # Deleting deactivates, so CouponUsage history survives.
        self.assertEqual(self.client.delete(url).status_code, 200)
        coupon.refresh_from_db()
        self.assertFalse(coupon.is_active)
        self.assertTrue(Coupon.objects.filter(pk=coupon.pk).exists())

    def test_patch_keeps_stored_dates_when_only_value_changes(self):
        """A partial update must not trip the date check against missing fields."""
        coupon = Coupon.objects.create(
            code='PARTIAL', discount_type='percentage', discount_value=10,
            valid_from=timezone.now() - timedelta(days=2),
            valid_till=timezone.now() + timedelta(days=2),
        )
        self.as_staff()
        res = self.client.patch(f'/api/admin/coupons/{coupon.id}/',
                                {'discount_value': '15'}, format='json')
        self.assertEqual(res.status_code, 200)


class PincodeListTest(StaffApiTestCase):
    def test_lists_and_searches(self):
        DeliveryPincode.objects.create(
            pincode='641001', city='Coimbatore', delivery_type='standard',
            estimated_days_text='2-3 days',
        )
        self.as_staff()
        self.assertEqual(self.client.get('/api/admin/pincodes/').data['count'], 2)
        self.assertEqual(
            self.client.get('/api/admin/pincodes/?search=Coimbatore').data['count'], 1)
        self.assertEqual(
            self.client.get('/api/admin/pincodes/?search=600001').data['count'], 1)


class RefundListTest(StaffApiTestCase):
    """Staff triaging refunds need to know which order each one belongs to -
    a plain RefundSerializer (built for a customer who already has that
    context) used to leave it off the wire entirely."""

    def test_includes_the_order_it_belongs_to(self):
        order = self.make_order(payment_status='paid', order_status='delivered')
        Refund.objects.create(order=order, amount=Decimal('500'), reason='Wrong size')

        self.as_staff()
        row = self.client.get('/api/admin/refunds/').data['results'][0]

        self.assertEqual(row['order_id'], order.order_id)


class CouponMoneyFormattingTest(TestCase):
    """Money must always be paise-precision, and labels must read naturally."""

    def test_percentage_discount_is_rounded_to_paise(self):
        from coupons.utils import compute_discount

        coupon = Coupon(discount_type='percentage', discount_value=Decimal('15'))
        # 15% of 2598 is 389.70 exactly, but the raw division carries a long tail.
        self.assertEqual(compute_discount(coupon, Decimal('2598.00')), Decimal('389.70'))
        self.assertEqual(str(compute_discount(coupon, Decimal('2598.00'))), '389.70')

    def test_awkward_percentage_rounds_half_up(self):
        from coupons.utils import compute_discount

        coupon = Coupon(discount_type='percentage', discount_value=Decimal('33'))
        self.assertEqual(compute_discount(coupon, Decimal('99.99')), Decimal('33.00'))

    def test_discount_never_exceeds_subtotal(self):
        from coupons.utils import compute_discount

        coupon = Coupon(discount_type='fixed', discount_value=Decimal('5000'))
        self.assertEqual(compute_discount(coupon, Decimal('120.00')), Decimal('120.00'))

    def test_labels_drop_trailing_zeros_without_exponents(self):
        from coupons.utils import discount_label

        self.assertEqual(
            discount_label(Coupon(discount_type='percentage', discount_value=Decimal('15.00'))),
            '15% off')
        self.assertEqual(
            discount_label(Coupon(discount_type='percentage', discount_value=Decimal('12.50'))),
            '12.5% off')
        # normalize() would render this as 1.5E+3 without the integral guard.
        self.assertEqual(
            discount_label(Coupon(discount_type='fixed', discount_value=Decimal('1500.00'))),
            '₹1500 off')


class DeliveryRatesEndpointTest(StaffApiTestCase):
    def test_returns_both_rate_cards_with_defaults(self):
        self.as_staff()
        data = self.client.get('/api/admin/delivery-rates/').data

        self.assertEqual(Decimal(data['tamil_nadu']['local_charge']), Decimal('30'))
        self.assertEqual(Decimal(data['tamil_nadu']['standard_charge']), Decimal('80'))
        self.assertEqual(Decimal(data['tamil_nadu']['free_delivery_threshold']), Decimal('500'))
        self.assertEqual(data['tamil_nadu']['weight_allowance_g'], 1000)
        self.assertEqual(Decimal(data['outside_tamil_nadu']['base_charge']), Decimal('150'))

    def test_reflects_an_edited_rate(self):
        from delivery.models import TamilNaduDeliveryRate

        config = TamilNaduDeliveryRate.get_config()
        config.local_charge = Decimal('42')
        config.save(update_fields=['local_charge'])

        self.as_staff()
        data = self.client.get('/api/admin/delivery-rates/').data
        self.assertEqual(Decimal(data['tamil_nadu']['local_charge']), Decimal('42'))


class DeliveryRateEditTest(StaffApiTestCase):
    """The staff dashboard's delivery page previously only displayed these
    rates read-only, pointing staff at Django Admin to actually change
    anything - these endpoints back real inline editing instead."""

    def test_updates_tamil_nadu_rate_and_it_affects_real_quotes(self):
        from delivery.utils import get_delivery_quote

        self.as_staff()
        res = self.client.patch('/api/admin/delivery-rates/tamil-nadu/',
                                {'local_charge': '55'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Decimal(res.data['local_charge']), Decimal('55'))

        quote = get_delivery_quote(pincode='600001', state='Tamil Nadu', order_total=Decimal('100'))
        self.assertEqual(quote['charge'], Decimal('55'))

    def test_partial_update_leaves_other_fields_untouched(self):
        self.as_staff()
        self.client.patch('/api/admin/delivery-rates/tamil-nadu/',
                          {'standard_charge': '99'}, format='json')
        data = self.client.get('/api/admin/delivery-rates/').data['tamil_nadu']
        self.assertEqual(Decimal(data['standard_charge']), Decimal('99'))
        self.assertEqual(Decimal(data['local_charge']), Decimal('30'))  # untouched

    def test_rejects_negative_charge(self):
        self.as_staff()
        res = self.client.patch('/api/admin/delivery-rates/tamil-nadu/',
                                {'local_charge': '-5'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_updates_outside_state_rate(self):
        self.as_staff()
        res = self.client.patch('/api/admin/delivery-rates/outside-tamil-nadu/',
                                {'base_charge': '200', 'is_active': False}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Decimal(res.data['base_charge']), Decimal('200'))
        self.assertFalse(res.data['is_active'])

    def test_customer_cannot_edit_rates(self):
        from delivery.models import TamilNaduDeliveryRate

        self.as_customer()
        res = self.client.patch('/api/admin/delivery-rates/tamil-nadu/',
                                {'local_charge': '1'}, format='json')
        self.assertEqual(res.status_code, 403)
        # The rejection must actually have left the stored rate alone.
        self.assertEqual(TamilNaduDeliveryRate.get_config().local_charge, Decimal('30'))
