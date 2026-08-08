import io
from unittest import mock
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from PIL import Image
from products.models import Category, Brand, Product, ProductVariant, ProductImage
from cart.models import Cart, CartItem
from delivery.models import DeliveryPincode
from coupons.models import Coupon, CouponUsage
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import json

User = get_user_model()


def make_test_image(name='test.jpg'):
    buf = io.BytesIO()
    Image.new('RGB', (20, 20), color='red').save(buf, format='JPEG')
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type='image/jpeg')


class BaseTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            phone='9876543210',
            first_name='Test',
            last_name='User',
        )

        self.cat = Category.objects.create(name='Test Shirts', slug='test-shirts')
        self.brand = Brand.objects.create(name='BestChoice', slug='bestchoice')
        self.product = Product.objects.create(
            name='Test Shirt',
            slug='test-shirt',
            category=self.cat,
            brand=self.brand,
            mrp=1999,
            selling_price=1299,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            color='Red',
            size='M',
            stock=10,
        )
        ProductImage.objects.create(
            product=self.product,
            image=make_test_image(),
            is_primary=True,
        )

        self.pincode = DeliveryPincode.objects.create(
            pincode='600001',
            city='Chennai',
            delivery_type='local',
            estimated_days_text='2-4 business days',
            store_pickup_available=True,
        )

        self.coupon = Coupon.objects.create(
            code='TEST20',
            discount_type='percentage',
            discount_value=20,
            min_cart_value=500,
            max_discount=500,
            valid_from=timezone.now() - timedelta(days=1),
            valid_till=timezone.now() + timedelta(days=30),
            usage_limit=100,
        )

    def auth(self, user=None):
        refresh = RefreshToken.for_user(user or self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def add_cart_item(self, product=None, variant=None, qty=1):
        product = product or self.product
        variant = variant or self.variant
        data = {'product': product.id, 'quantity': qty}
        if variant:
            data['variant'] = variant.id
        return self.client.post('/api/cart/items/', data, format='json')

    def checkout(self):
        return self.client.post('/api/checkout/', {
            'shipping_address': {
                'full_name': 'Test User', 'phone': '9876543210',
                'address_line1': '123 Main St', 'city': 'Chennai',
                'pincode': '600001', 'state': 'Tamilnadu',
            },
            'delivery_type': 'home',
        }, format='json')


class AuthTest(BaseTestCase):
    def test_customer_password_endpoints_are_gone(self):
        for path in ('/api/auth/register/', '/api/auth/login/'):
            self.assertEqual(self.client.post(path, {}).status_code, 404)

    def test_token_refresh_still_works(self):
        refresh = RefreshToken.for_user(self.user)
        res = self.client.post('/api/auth/token/refresh/', {'refresh': str(refresh)}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)

    def test_get_profile(self):
        self.auth()
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['email'], 'test@example.com')

    def test_get_profile_unauthenticated(self):
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, 401)

    def test_update_profile(self):
        self.auth()
        res = self.client.put('/api/auth/me/', {'first_name': 'Johnny'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['first_name'], 'Johnny')


class ProductTest(BaseTestCase):
    def test_list_products(self):
        res = self.client.get('/api/products/')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data['results']), 1)

    def test_product_detail(self):
        res = self.client.get(f'/api/products/{self.product.slug}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['name'], 'Test Shirt')

    def test_unknown_product_returns_404(self):
        res = self.client.get('/api/products/no-such-product/')
        self.assertEqual(res.status_code, 404)

    def test_list_categories(self):
        res = self.client.get('/api/categories/')
        self.assertEqual(res.status_code, 200)
        names = [c['name'] for c in res.data['results']]
        self.assertTrue(any('Shirts' in n for n in names))

    def test_search_products(self):
        res = self.client.get('/api/products/?search=Test')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data['results']), 1)

    def test_filter_by_category(self):
        res = self.client.get('/api/products/?category=shirts')
        self.assertEqual(res.status_code, 200)

    def test_filter_by_price(self):
        res = self.client.get('/api/products/?min_price=1000&max_price=2000')
        self.assertEqual(res.status_code, 200)

    def test_health_endpoint(self):
        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(json.loads(res.content)['status'], 'ok')

    def test_brands_endpoint(self):
        res = self.client.get('/api/brands/')
        self.assertEqual(res.status_code, 200)


class CartTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.auth()

    def test_empty_cart(self):
        res = self.client.get('/api/cart/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['items']), 0)

    def test_add_to_cart(self):
        res = self.add_cart_item(qty=2)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['quantity'], 2)

    def test_add_to_cart_without_variant(self):
        p2 = Product.objects.create(
            name='Simple Product', slug='simple-product',
            category=self.cat, mrp=999, selling_price=599, total_stock=10,
        )
        res = self.client.post('/api/cart/items/', {'product': p2.id, 'quantity': 1}, format='json')
        self.assertEqual(res.status_code, 201)

    def test_add_duplicate_increments_quantity(self):
        self.add_cart_item(qty=1)
        res = self.add_cart_item(qty=2)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['quantity'], 3)

    def test_update_cart_item(self):
        item_res = self.add_cart_item(qty=1)
        item_id = item_res.data['id']
        res = self.client.put(f'/api/cart/items/{item_id}/', {'quantity': 5}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['quantity'], 5)

    def test_remove_cart_item(self):
        item_res = self.add_cart_item(qty=1)
        item_id = item_res.data['id']
        res = self.client.delete(f'/api/cart/items/{item_id}/')
        self.assertEqual(res.status_code, 204)

    def test_cart_total(self):
        self.add_cart_item(qty=2)
        res = self.client.get('/api/cart/')
        self.assertEqual(Decimal(res.data['total']), Decimal('2598.00'))

    def test_add_out_of_stock_fails(self):
        self.variant.stock = 0
        self.variant.save()
        res = self.add_cart_item(qty=1)
        self.assertEqual(res.status_code, 400)


class CouponTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.auth()

    def apply(self, code='TEST20'):
        return self.client.post('/api/cart/apply-coupon/', {'code': code}, format='json')

    def test_apply_valid_coupon_returns_discounted_cart(self):
        self.add_cart_item(qty=1)  # 1299
        res = self.apply()
        self.assertEqual(res.status_code, 200)
        cart = res.data['cart']
        # 20% of 1299 = 259.80, under the 500 max_discount cap.
        self.assertEqual(Decimal(cart['discount']), Decimal('259.80'))
        self.assertEqual(Decimal(cart['total']), Decimal('1039.20'))
        self.assertEqual(cart['coupon']['code'], 'TEST20')

    def test_apply_invalid_coupon(self):
        res = self.apply('INVALID')
        self.assertEqual(res.status_code, 400)

    def test_apply_coupon_empty_cart(self):
        res = self.apply()
        self.assertEqual(res.status_code, 400)

    def test_coupon_persists_across_requests(self):
        self.add_cart_item(qty=1)
        self.apply()
        res = self.client.get('/api/cart/')
        self.assertEqual(res.data['coupon']['code'], 'TEST20')
        self.assertEqual(Decimal(res.data['discount']), Decimal('259.80'))

    def test_remove_coupon_clears_the_discount(self):
        self.add_cart_item(qty=1)
        self.apply()
        res = self.client.delete('/api/cart/remove-coupon/')
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data['cart']['coupon'])
        self.assertEqual(Decimal(res.data['cart']['discount']), Decimal('0'))
        self.assertEqual(Decimal(self.client.get('/api/cart/').data['discount']), Decimal('0'))

    def test_applying_does_not_consume_the_coupon(self):
        """Usage is consumed at order time. Applying then abandoning must not burn it."""
        self.add_cart_item(qty=1)
        self.apply()
        self.coupon.refresh_from_db()
        self.assertEqual(self.coupon.used_count, 0)
        self.assertEqual(CouponUsage.objects.filter(coupon=self.coupon).count(), 0)
        # ...and the same user can still apply it again.
        self.assertEqual(self.apply().status_code, 200)

    def test_min_cart_value_enforced(self):
        self.coupon.min_cart_value = 5000
        self.coupon.save(update_fields=['min_cart_value'])
        self.add_cart_item(qty=1)
        res = self.apply()
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data['code'], 'MIN_CART')

    def test_discount_drops_when_cart_falls_below_min_cart_value(self):
        self.add_cart_item(qty=2)  # 2598
        self.apply()
        self.coupon.min_cart_value = 2000
        self.coupon.save(update_fields=['min_cart_value'])

        item_id = self.client.get('/api/cart/').data['items'][0]['id']
        self.client.put(f'/api/cart/items/{item_id}/', {'quantity': 1}, format='json')

        res = self.client.get('/api/cart/')
        self.assertEqual(Decimal(res.data['discount']), Decimal('0'))
        self.assertIsNone(res.data['coupon'])
        self.assertEqual(Decimal(res.data['total']), Decimal(res.data['subtotal']))

    def test_fixed_discount_type(self):
        self.coupon.discount_type = 'fixed'
        self.coupon.discount_value = 300
        self.coupon.save(update_fields=['discount_type', 'discount_value'])
        self.add_cart_item(qty=1)
        self.assertEqual(Decimal(self.apply().data['cart']['discount']), Decimal('300'))

    def test_max_discount_caps_percentage(self):
        self.add_cart_item(qty=5)  # 6495; 20% = 1299, capped at 500
        self.assertEqual(Decimal(self.apply().data['cart']['discount']), Decimal('500'))

    def test_discount_never_exceeds_subtotal(self):
        self.coupon.discount_type = 'fixed'
        self.coupon.discount_value = 99999
        self.coupon.min_cart_value = 0
        self.coupon.save()
        self.add_cart_item(qty=1)
        cart = self.apply().data['cart']
        self.assertEqual(Decimal(cart['discount']), Decimal(cart['subtotal']))
        self.assertEqual(Decimal(cart['total']), Decimal('0'))


class CouponCheckoutTest(BaseTestCase):
    """A coupon must actually reduce what the customer is charged."""

    def setUp(self):
        super().setUp()
        self.auth()
        self._rzp = mock.patch('orders.views.client.order.create',
                               return_value={'id': 'rzp_test_order_123'})
        self._rzp.start()
        self.addCleanup(self._rzp.stop)

    def test_coupon_reduces_order_total_and_is_recorded(self):
        from orders.models import Order

        self.add_cart_item(qty=1)  # 1299
        self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')
        res = self.checkout()
        self.assertEqual(res.status_code, 201, res.data)

        order = Order.objects.get(order_id=res.data['order_id'])
        self.assertEqual(order.coupon, self.coupon)
        self.assertEqual(order.discount, Decimal('259.80'))
        # 1299 - 259.80, delivery free because the subtotal clears the Rs.500
        # threshold (which is measured before discounts).
        self.assertEqual(order.total, Decimal('1039.20'))
        self.assertEqual(Decimal(res.data['coupon_discount']), Decimal('259.80'))
        self.assertEqual(Decimal(res.data['delivery_charge']), Decimal('0'))

    def test_usage_is_consumed_once_at_order_time(self):
        self.add_cart_item(qty=1)
        self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')
        self.checkout()

        self.coupon.refresh_from_db()
        self.assertEqual(self.coupon.used_count, 1)
        self.assertEqual(
            CouponUsage.objects.filter(coupon=self.coupon, user=self.user).count(), 1
        )

    def test_per_user_limit_blocks_a_second_order(self):
        self.add_cart_item(qty=1)
        self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')
        self.checkout()

        self.add_cart_item(qty=1)
        res = self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data['code'], 'ALREADY_USED')

    def test_checkout_clears_the_applied_coupon(self):
        self.add_cart_item(qty=1)
        self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')
        self.checkout()
        self.assertIsNone(self.client.get('/api/cart/').data['coupon'])

    def test_coupon_and_loyalty_points_stack(self):
        from orders.models import Order

        self.user.loyalty_points = 100
        self.user.save(update_fields=['loyalty_points'])
        self.add_cart_item(qty=1)  # 1299, 20% cap on points = 259
        self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')

        res = self.client.post('/api/checkout/', {
            'shipping_address': {
                'full_name': 'Test User', 'phone': '9876543210',
                'address_line1': '123 Main St', 'city': 'Chennai',
                'pincode': '600001', 'state': 'Tamilnadu',
            },
            'delivery_type': 'home',
            'loyalty_points_used': 100,
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)

        order = Order.objects.get(order_id=res.data['order_id'])
        self.assertEqual(order.discount, Decimal('359.80'))  # 259.80 coupon + 100 points

    def test_cancelling_gives_the_coupon_use_back(self):
        self.add_cart_item(qty=1)
        self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')
        order_id = self.checkout().data['order_id']

        self.client.post(f'/api/orders/{order_id}/cancel/', {}, format='json')

        self.coupon.refresh_from_db()
        self.assertEqual(self.coupon.used_count, 0)
        self.assertEqual(CouponUsage.objects.filter(coupon=self.coupon).count(), 0)

    def test_gateway_failure_leaves_no_stock_or_coupon_consumed(self):
        self.add_cart_item(qty=2)
        self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')

        with mock.patch('orders.views.client.order.create',
                        side_effect=RuntimeError('gateway down')):
            res = self.checkout()

        self.assertEqual(res.status_code, 502)
        self.variant.refresh_from_db()
        self.coupon.refresh_from_db()
        self.assertEqual(self.variant.stock, 10)  # untouched
        self.assertEqual(self.coupon.used_count, 0)


class CartStockGuardTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.auth()

    def test_quantity_update_cannot_exceed_stock(self):
        item_id = self.add_cart_item(qty=1).data['id']
        res = self.client.put(f'/api/cart/items/{item_id}/', {'quantity': 99}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Only 10 items available', str(res.data))

    def test_quantity_update_within_stock_succeeds(self):
        item_id = self.add_cart_item(qty=1).data['id']
        res = self.client.put(f'/api/cart/items/{item_id}/', {'quantity': 10}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['quantity'], 10)

    def test_non_numeric_quantity_rejected(self):
        item_id = self.add_cart_item(qty=1).data['id']
        res = self.client.put(f'/api/cart/items/{item_id}/', {'quantity': 'lots'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_partial_stock_shortage_deducts_nothing(self):
        """A shortage on the second line must not leave the first already deducted."""
        p2 = Product.objects.create(name='Scarce', slug='scarce', category=self.cat,
                                    mrp=500, selling_price=400)
        v2 = ProductVariant.objects.create(product=p2, color='Grey', size='S', stock=1)
        self.add_cart_item(qty=2)
        CartItem.objects.create(cart=Cart.objects.get(user=self.user),
                                product=p2, variant=v2, quantity=5, price=400)

        with mock.patch('orders.views.client.order.create',
                        return_value={'id': 'rzp_x'}):
            res = self.checkout()

        self.assertEqual(res.status_code, 400)
        self.variant.refresh_from_db()
        v2.refresh_from_db()
        self.assertEqual(self.variant.stock, 10)
        self.assertEqual(v2.stock, 1)


class GuestCartMergeTest(BaseTestCase):
    """A guest's cart must survive signing in."""

    def _guest_cart_with_item(self, qty=2):
        self.client.credentials()  # anonymous
        res = self.add_cart_item(qty=qty)
        self.assertEqual(res.status_code, 201)
        return Cart.objects.get(user__isnull=True)

    def _google_signin(self, email):
        with self.settings(GOOGLE_OAUTH_CLIENT_ID='cid'), \
                mock.patch('google.oauth2.id_token.verify_oauth2_token',
                           return_value={'email': email, 'email_verified': True,
                                         'given_name': 'G', 'family_name': 'U'}):
            return self.client.post('/api/auth/google/', {'credential': 'tok'}, format='json')

    def test_guest_items_move_to_the_user_cart(self):
        self._guest_cart_with_item(qty=2)
        res = self._google_signin('test@example.com')
        self.assertEqual(res.status_code, 200)

        self.auth()
        cart = self.client.get('/api/cart/').data
        self.assertEqual(cart['item_count'], 2)
        self.assertFalse(Cart.objects.filter(user__isnull=True).exists())

    def test_quantities_combine_without_exceeding_stock(self):
        self.auth()
        self.add_cart_item(qty=6)          # in the user's cart
        self.client.credentials()
        self.add_cart_item(qty=6)          # and 6 more as a guest

        self._google_signin('test@example.com')

        self.auth()
        cart = self.client.get('/api/cart/').data
        self.assertEqual(cart['item_count'], 10)  # capped at variant stock, not 12

    def test_guest_coupon_carries_over(self):
        self._guest_cart_with_item(qty=1)
        self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')

        self._google_signin('test@example.com')

        self.auth()
        self.assertEqual(self.client.get('/api/cart/').data['coupon']['code'], 'TEST20')

    def test_signing_in_with_no_guest_cart_is_harmless(self):
        res = self._google_signin('brandnew@example.com')
        self.assertEqual(res.status_code, 201)


class OrderTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.auth()
        from unittest.mock import patch
        self._mock_razorpay = patch('orders.views.client.order.create')
        self._mock_create = self._mock_razorpay.start()
        self._mock_create.return_value = {'id': 'rzp_test_order_123'}

    def tearDown(self):
        self._mock_razorpay.stop()
        super().tearDown()

    def test_checkout_creates_order(self):
        self.add_cart_item(qty=1)
        res = self.checkout()
        self.assertEqual(res.status_code, 201)
        self.assertIn('razorpay_order_id', res.data)
        self.assertIn('order_id', res.data)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 9)

    def test_checkout_empty_cart(self):
        res = self.checkout()
        self.assertEqual(res.status_code, 400)

    def test_checkout_deducts_stock(self):
        self.add_cart_item(qty=3)
        self.checkout()
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 7)

    def test_checkout_rejects_points_over_max_redeem_percent(self):
        self.user.loyalty_points = 1000
        self.user.save(update_fields=['loyalty_points'])
        self.add_cart_item(qty=1)  # subtotal 1299 -> 20% cap = 259 points
        res = self.client.post('/api/checkout/', {
            'shipping_address': {
                'full_name': 'Test User', 'phone': '9876543210',
                'address_line1': '123 Main St', 'city': 'Chennai',
                'pincode': '600001', 'state': 'Tamilnadu',
            },
            'delivery_type': 'home',
            'loyalty_points_used': 500,
        }, format='json')
        self.assertEqual(res.status_code, 400)

    def test_checkout_accepts_points_within_max_redeem_percent(self):
        self.user.loyalty_points = 1000
        self.user.save(update_fields=['loyalty_points'])
        self.add_cart_item(qty=1)
        res = self.client.post('/api/checkout/', {
            'shipping_address': {
                'full_name': 'Test User', 'phone': '9876543210',
                'address_line1': '123 Main St', 'city': 'Chennai',
                'pincode': '600001', 'state': 'Tamilnadu',
            },
            'delivery_type': 'home',
            'loyalty_points_used': 100,
        }, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['discount'], '100.00')

    def test_cancel_order_restores_stock(self):
        self.add_cart_item(qty=2)
        checkout = self.checkout().data
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 8)
        res = self.client.post(f'/api/orders/{checkout["order_id"]}/cancel/')
        self.assertEqual(res.status_code, 200)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 10)

    def test_cancel_shipped_order_fails(self):
        self.add_cart_item(qty=1)
        checkout = self.checkout().data
        order_id = checkout['order_id']
        from orders.models import Order
        Order.objects.filter(order_id=order_id).update(status='shipped')
        res = self.client.post(f'/api/orders/{order_id}/cancel/')
        self.assertEqual(res.status_code, 400)

    def test_order_list(self):
        self.add_cart_item(qty=1)
        self.checkout()
        res = self.client.get('/api/orders/')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data), 1)

    def test_order_detail(self):
        self.add_cart_item(qty=1)
        checkout = self.checkout().data
        res = self.client.get(f'/api/orders/{checkout["order_id"]}/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('items', res.data)


class DeliveryTest(BaseTestCase):
    def test_check_available_pincode(self):
        res = self.client.get('/api/delivery/check/600001/')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.content) if hasattr(res, 'content') else res.data
        self.assertTrue(data['delivery_available'])
        self.assertEqual(data['delivery_type'], 'local')

    def test_check_unavailable_pincode(self):
        # An unrecognised pincode with an explicit Tamil Nadu state has
        # nowhere else to fall back to, so it's genuinely undeliverable.
        res = self.client.get('/api/delivery/check/999999/', {'state': 'Tamil Nadu'})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.content) if hasattr(res, 'content') else res.data
        self.assertFalse(data['delivery_available'])

    def test_check_unknown_pincode_without_state_falls_back_to_outside_rate(self):
        # A pincode we don't recognise, with no state given at all (this is
        # what the product page sends), used to be wrongly forced through
        # the Tamil-Nadu-only pincode table and declared undeliverable -
        # covering the vast majority of real Indian pincodes. It should now
        # resolve via the outside-Tamil-Nadu rate instead.
        res = self.client.get('/api/delivery/check/560001/')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.content) if hasattr(res, 'content') else res.data
        self.assertTrue(data['delivery_available'])
        self.assertEqual(data['zone'], 'outside_tamilnadu')


class WishlistTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.auth()

    def test_add_to_wishlist(self):
        res = self.client.post('/api/wishlist/', {'product': self.product.id}, format='json')
        self.assertEqual(res.status_code, 201)

    def test_add_duplicate_to_wishlist(self):
        self.client.post('/api/wishlist/', {'product': self.product.id}, format='json')
        res = self.client.post('/api/wishlist/', {'product': self.product.id}, format='json')
        self.assertEqual(res.status_code, 200)

    def test_list_wishlist(self):
        self.client.post('/api/wishlist/', {'product': self.product.id}, format='json')
        res = self.client.get('/api/wishlist/')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data), 1)

    def test_remove_from_wishlist(self):
        self.client.post('/api/wishlist/', {'product': self.product.id}, format='json')
        res = self.client.delete(f'/api/wishlist/{self.product.id}/')
        self.assertEqual(res.status_code, 204)

    def test_remove_nonexistent(self):
        res = self.client.delete('/api/wishlist/99999/')
        self.assertEqual(res.status_code, 404)


class RefundTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.auth()
        from orders.models import Order
        from loyalty.utils import earn_points

        # The customer requests a refund; only staff may approve it.
        self.staff = User.objects.create_user(
            email='refunds@bestchoice.in', username='refunds',
            password='staffpass123', is_staff=True,
        )

        self.order = Order.objects.create(
            order_id='BC-ORD-REFUND-0001', user=self.user, subtotal=1000, total=1000,
            status='delivered', payment_status='paid',
            shipping_address={'pincode': '600001', 'state': 'Tamil Nadu'},
            loyalty_points_earned=10,
        )
        earn_points(self.user, 10, order=self.order, description='Order BC-ORD-REFUND-0001')

    def request_refund(self):
        return self.client.post(f'/api/orders/{self.order.order_id}/refund/', {'reason': 'Wrong size'}, format='json')

    def set_refund_status(self, refund_id, new_status):
        """Approve/reject as staff, then hand the session back to the customer."""
        self.auth(self.staff)
        try:
            return self.client.post(f'/api/admin/refunds/{refund_id}/status/',
                                    {'status': new_status}, format='json')
        finally:
            self.auth(self.user)

    def test_request_refund_does_not_reverse_points_yet(self):
        self.request_refund()
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 10)

    def test_customer_cannot_approve_their_own_refund(self):
        refund_id = self.request_refund().data['id']
        res = self.client.post(f'/api/admin/refunds/{refund_id}/status/',
                               {'status': 'approved'}, format='json')
        self.assertEqual(res.status_code, 403)
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 10)

    def test_approving_refund_reverses_points(self):
        refund_id = self.request_refund().data['id']
        res = self.set_refund_status(refund_id, 'approved')
        self.assertEqual(res.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 0)

    def test_rejecting_refund_does_not_reverse_points(self):
        refund_id = self.request_refund().data['id']
        res = self.set_refund_status(refund_id, 'rejected')
        self.assertEqual(res.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 10)

    def test_approving_refund_twice_does_not_double_reverse(self):
        refund_id = self.request_refund().data['id']
        self.set_refund_status(refund_id, 'approved')
        self.set_refund_status(refund_id, 'processed')
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_points, 0)

    def test_invalid_status_rejected(self):
        refund_id = self.request_refund().data['id']
        res = self.set_refund_status(refund_id, 'bogus')
        self.assertEqual(res.status_code, 400)


class LoyaltyTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.auth()

    def test_balance(self):
        res = self.client.get('/api/loyalty/balance/')
        self.assertEqual(res.status_code, 200)

    def test_transactions(self):
        res = self.client.get('/api/loyalty/transactions/')
        self.assertEqual(res.status_code, 200)


class ReviewsTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.auth()

    def test_create_review(self):
        res = self.client.post(f'/api/products/{self.product.slug}/reviews/', {
            'rating': 5, 'text': 'Great product!',
        }, format='json')
        self.assertEqual(res.status_code, 201)

    def test_list_reviews(self):
        self.client.post(f'/api/products/{self.product.slug}/reviews/', {
            'rating': 4, 'text': 'Nice!',
        }, format='json')
        res = self.client.get(f'/api/products/{self.product.slug}/reviews/')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(res.data['total_reviews'], 1)

    def test_my_reviews(self):
        res = self.client.get('/api/reviews/mine/')
        self.assertEqual(res.status_code, 200)


class StaffLoginTest(BaseTestCase):
    URL = '/api/auth/staff/login/'

    def setUp(self):
        super().setUp()
        self.client.credentials()
        self.staff = User.objects.create_user(
            email='manager@bestchoice.in',
            username='manager',
            password='staffpass123',
            is_staff=True,
        )

    def test_staff_can_log_in(self):
        res = self.client.post(self.URL, {
            'email': 'manager@bestchoice.in', 'password': 'staffpass123',
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)
        self.assertEqual(res.data['user']['email'], 'manager@bestchoice.in')

    def test_email_is_case_insensitive(self):
        res = self.client.post(self.URL, {
            'email': 'Manager@BestChoice.IN', 'password': 'staffpass123',
        }, format='json')
        self.assertEqual(res.status_code, 200)

    def test_non_staff_customer_is_rejected(self):
        res = self.client.post(self.URL, {
            'email': 'test@example.com', 'password': 'testpass123',
        }, format='json')
        self.assertEqual(res.status_code, 403)

    def test_wrong_password_returns_401(self):
        res = self.client.post(self.URL, {
            'email': 'manager@bestchoice.in', 'password': 'nope',
        }, format='json')
        self.assertEqual(res.status_code, 401)

    def test_missing_fields_return_400(self):
        res = self.client.post(self.URL, {'email': 'manager@bestchoice.in'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_inactive_staff_is_rejected(self):
        self.staff.is_active = False
        self.staff.save(update_fields=['is_active'])
        res = self.client.post(self.URL, {
            'email': 'manager@bestchoice.in', 'password': 'staffpass123',
        }, format='json')
        self.assertEqual(res.status_code, 401)


class GoogleLoginTest(BaseTestCase):
    URL = '/api/auth/google/'

    def setUp(self):
        super().setUp()
        self.client.credentials()

    def _payload(self, email, verified=True, **extra):
        return {
            'email': email,
            'email_verified': verified,
            'given_name': 'Google',
            'family_name': 'User',
            **extra,
        }

    def test_not_configured_returns_503(self):
        with self.settings(GOOGLE_OAUTH_CLIENT_ID=''):
            res = self.client.post(self.URL, {'credential': 'x'}, format='json')
        self.assertEqual(res.status_code, 503)

    def test_missing_credential_returns_400(self):
        with self.settings(GOOGLE_OAUTH_CLIENT_ID='cid'):
            res = self.client.post(self.URL, {}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_invalid_credential_returns_401(self):
        with self.settings(GOOGLE_OAUTH_CLIENT_ID='cid'), \
                mock.patch('google.oauth2.id_token.verify_oauth2_token',
                           side_effect=ValueError('bad token')):
            res = self.client.post(self.URL, {'credential': 'bad'}, format='json')
        self.assertEqual(res.status_code, 401)

    def test_unverified_email_rejected(self):
        with self.settings(GOOGLE_OAUTH_CLIENT_ID='cid'), \
                mock.patch('google.oauth2.id_token.verify_oauth2_token',
                           return_value=self._payload('new@gmail.com', verified=False)):
            res = self.client.post(self.URL, {'credential': 'tok'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertFalse(User.objects.filter(email='new@gmail.com').exists())

    def test_new_user_is_created_with_tokens_and_welcome_bonus(self):
        with self.settings(GOOGLE_OAUTH_CLIENT_ID='cid'), \
                mock.patch('google.oauth2.id_token.verify_oauth2_token',
                           return_value=self._payload('new@gmail.com')):
            res = self.client.post(self.URL, {'credential': 'tok'}, format='json')

        self.assertEqual(res.status_code, 201)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        user = User.objects.get(email='new@gmail.com')
        self.assertEqual(user.first_name, 'Google')
        self.assertFalse(user.has_usable_password())
        self.assertGreater(user.loyalty_points, 0)

    def test_existing_user_logs_in_without_duplicate(self):
        with self.settings(GOOGLE_OAUTH_CLIENT_ID='cid'), \
                mock.patch('google.oauth2.id_token.verify_oauth2_token',
                           return_value=self._payload('test@example.com')):
            res = self.client.post(self.URL, {'credential': 'tok'}, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['email'], 'test@example.com')
        self.assertEqual(User.objects.filter(email='test@example.com').count(), 1)

    def test_email_match_is_case_insensitive(self):
        with self.settings(GOOGLE_OAUTH_CLIENT_ID='cid'), \
                mock.patch('google.oauth2.id_token.verify_oauth2_token',
                           return_value=self._payload('TEST@EXAMPLE.COM')):
            res = self.client.post(self.URL, {'credential': 'tok'}, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(User.objects.filter(email__iexact='test@example.com').count(), 1)

    def test_referral_code_is_applied_on_signup(self):
        with self.settings(GOOGLE_OAUTH_CLIENT_ID='cid'), \
                mock.patch('google.oauth2.id_token.verify_oauth2_token',
                           return_value=self._payload('referred@gmail.com')):
            res = self.client.post(self.URL, {
                'credential': 'tok',
                'referral_code': self.user.referral_code,
            }, format='json')

        self.assertEqual(res.status_code, 201)
        self.assertEqual(User.objects.get(email='referred@gmail.com').referred_by, self.user)


class AdminEndpointPermissionTest(BaseTestCase):
    """The /api/admin/ endpoints must reject non-staff callers.

    They previously used IsAuthenticated only, so any signed-in customer could
    change order status, approve refunds (moving real money via Razorpay), or
    edit product pricing and stock.
    """

    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user(
            email='manager2@bestchoice.in', username='manager2',
            password='staffpass123', is_staff=True,
        )

    def _endpoints(self):
        return [
            ('post', '/api/admin/orders/BC-DOES-NOT-EXIST/status/', {'status': 'shipped'}),
            ('post', '/api/admin/refunds/999999/status/', {'status': 'approved'}),
            ('put', f'/api/admin/products/{self.product.pk}/', {'selling_price': '1'}),
        ]

    def test_customer_is_forbidden(self):
        self.auth(self.user)
        for method, url, payload in self._endpoints():
            res = getattr(self.client, method)(url, payload, format='json')
            self.assertEqual(res.status_code, 403, f'{url} allowed a non-staff user')

    def test_anonymous_is_unauthorized(self):
        self.client.credentials()
        for method, url, payload in self._endpoints():
            res = getattr(self.client, method)(url, payload, format='json')
            self.assertEqual(res.status_code, 401, f'{url} allowed an anonymous user')

    def test_staff_gets_past_the_permission_check(self):
        self.auth(self.staff)
        # 404 for the deliberately-missing order/refund proves the permission
        # check passed and the view ran; the product update should succeed.
        for method, url, payload in self._endpoints():
            res = getattr(self.client, method)(url, payload, format='json')
            self.assertNotIn(res.status_code, (401, 403), f'{url} rejected a staff user')


class OrderConfirmationEmailTest(BaseTestCase):
    """The confirmation email is sent after the order is marked paid, so a
    failure in it must never surface as an error to the caller.

    The `notifications` app was missing from INSTALLED_APPS, so its template
    was unreachable and render_to_string raised TemplateDoesNotExist right
    after payment succeeded.
    """

    def setUp(self):
        super().setUp()
        self.auth()
        self._mock_razorpay = mock.patch('orders.views.client.order.create',
                                         return_value={'id': 'rzp_test_order_123'})
        self._mock_razorpay.start()
        self.addCleanup(self._mock_razorpay.stop)

    def _order(self):
        self.add_cart_item()
        res = self.checkout()
        self.assertEqual(res.status_code, 201, res.data)
        from orders.models import Order
        return Order.objects.get(order_id=res.data['order_id'])

    def test_template_is_reachable(self):
        from django.template.loader import render_to_string
        html = render_to_string('notifications/order_confirmation.html', {
            'order': self._order(), 'items': [], 'subtotal': 0,
            'discount': 0, 'delivery_charge': 0, 'total': 0,
        })
        self.assertIn('<', html)

    def test_sends_without_raising(self):
        from django.core import mail
        from notifications.utils import send_order_confirmation
        send_order_confirmation(self._order())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Order Confirmed', mail.outbox[0].subject)

    def test_swallows_failures_instead_of_raising(self):
        from notifications.utils import send_order_confirmation
        order = self._order()
        with mock.patch('notifications.utils.render_to_string',
                        side_effect=RuntimeError('boom')):
            send_order_confirmation(order)  # must not propagate


class TotalStockSyncTest(BaseTestCase):
    """Product.total_stock is denormalised from variant stock.

    It used to be a plain field nobody wrote to, so every product with variants
    reported total_stock=0 - meaning in_stock False, stock_status "Out of Stock",
    and permanent invisibility when hide_if_out_of_stock was set. Django Admin
    lists the field as readonly, so shop staff could not correct it by hand.
    """

    def test_creating_a_variant_sets_total_stock(self):
        self.product.refresh_from_db()
        self.assertEqual(self.product.total_stock, 10)  # BaseTestCase variant

    def test_adding_variants_accumulates(self):
        ProductVariant.objects.create(product=self.product, color='Blue', size='L', stock=7)
        self.product.refresh_from_db()
        self.assertEqual(self.product.total_stock, 17)

    def test_editing_variant_stock_resyncs(self):
        self.variant.stock = 3
        self.variant.save()
        self.product.refresh_from_db()
        self.assertEqual(self.product.total_stock, 3)

    def test_deleting_a_variant_resyncs(self):
        ProductVariant.objects.create(product=self.product, color='Blue', size='L', stock=7)
        self.variant.delete()
        self.product.refresh_from_db()
        self.assertEqual(self.product.total_stock, 7)

    def test_deleting_the_last_variant_resets_stock_to_zero(self):
        # variants.exists() is already False by the time delete() calls back
        # into sync_total_stock() here, which used to make it a no-op and
        # leave total_stock stuck at whatever it was before.
        self.variant.delete()
        self.product.refresh_from_db()
        self.assertEqual(self.product.total_stock, 0)

    def test_variantless_product_keeps_its_manual_value(self):
        p = Product.objects.create(
            name='No Variants', slug='no-variants', category=self.cat,
            mrp=500, selling_price=400, total_stock=25,
        )
        p.sync_total_stock()
        p.refresh_from_db()
        self.assertEqual(p.total_stock, 25)

    def test_checkout_deduction_keeps_total_stock_in_step(self):
        self.auth()
        with mock.patch('orders.views.client.order.create',
                        return_value={'id': 'rzp_test_order_123'}):
            self.add_cart_item(qty=4)
            self.checkout()
        self.product.refresh_from_db()
        self.assertEqual(self.product.total_stock, 6)

    def test_api_no_longer_reports_stocked_products_as_out_of_stock(self):
        res = self.client.get(f'/api/products/{self.product.slug}/')
        self.assertEqual(res.status_code, 200)
        # 10 units sits on the low_stock side of the badge boundary (in_stock is > 10).
        self.assertEqual(res.data['stock_status']['badge'], 'low_stock')
        self.assertEqual(res.data['stock_status']['label'], 'Only 10 Left')

    def test_plenty_of_stock_reports_in_stock(self):
        ProductVariant.objects.create(product=self.product, color='Blue', size='L', stock=20)
        res = self.client.get(f'/api/products/{self.product.slug}/')
        self.assertEqual(res.data['stock_status']['badge'], 'in_stock')

    def test_list_serializer_reports_in_stock_true(self):
        res = self.client.get('/api/products/')
        row = next(p for p in res.data['results'] if p['slug'] == self.product.slug)
        self.assertTrue(row['in_stock'])

    def test_hide_if_out_of_stock_does_not_hide_stocked_products(self):
        self.product.hide_if_out_of_stock = True
        self.product.save(update_fields=['hide_if_out_of_stock'])
        res = self.client.get('/api/products/')
        slugs = [p['slug'] for p in res.data['results']]
        self.assertIn(self.product.slug, slugs)
