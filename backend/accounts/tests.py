import io
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from PIL import Image
from products.models import Category, Brand, Product, ProductVariant, ProductImage
from delivery.models import DeliveryPincode
from coupons.models import Coupon
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
            delivery_type='same_day',
            estimated_days_text='Today',
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

    def auth(self):
        login = self.client.post('/api/auth/login/', {
            'email': 'test@example.com', 'password': 'testpass123',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

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
    def test_register(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'new@example.com', 'phone': '9876543211',
            'password': 'newpass123', 'first_name': 'New', 'last_name': 'User',
        })
        self.assertEqual(res.status_code, 201)
        self.assertIn('access', res.data)

    def test_register_duplicate_email(self):
        self.client.post('/api/auth/register/', {
            'email': 'dup@example.com', 'phone': '9876543212',
            'password': 'pass123', 'first_name': 'Dup',
        })
        res = self.client.post('/api/auth/register/', {
            'email': 'dup@example.com', 'phone': '9876543213',
            'password': 'pass123', 'first_name': 'Dup',
        })
        self.assertEqual(res.status_code, 400)

    def test_login(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'test@example.com', 'password': 'testpass123',
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)

    def test_login_wrong_password(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'test@example.com', 'password': 'wrong',
        })
        self.assertEqual(res.status_code, 401)

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

    def test_apply_valid_coupon(self):
        self.add_cart_item(qty=1)
        res = self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('discount', res.data)

    def test_apply_invalid_coupon(self):
        res = self.client.post('/api/cart/apply-coupon/', {'code': 'INVALID'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_apply_coupon_empty_cart(self):
        res = self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_remove_coupon(self):
        self.add_cart_item(qty=1)
        self.client.post('/api/cart/apply-coupon/', {'code': 'TEST20'}, format='json')
        res = self.client.delete('/api/cart/remove-coupon/')
        self.assertEqual(res.status_code, 200)


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
        self.assertEqual(data['delivery_type'], 'same_day')

    def test_check_unavailable_pincode(self):
        res = self.client.get('/api/delivery/check/999999/')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.content) if hasattr(res, 'content') else res.data
        self.assertFalse(data['delivery_available'])


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
