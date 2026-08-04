from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory, TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from orders.models import Order, OrderItem
from products.models import Category, Product

from .admin import ReviewAdmin
from .models import Review, ReviewConfig

User = get_user_model()


class ReviewTestBase(TestCase):
    """Self-contained fixtures - deliberately does not reuse accounts.tests.BaseTestCase
    so the reviews suite does not depend on another app's test module."""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='reviewer@example.com',
            username='reviewer',
            password='reviewpass123',
            phone='9800000001',
            first_name='Ravi',
            last_name='Kumar',
        )
        self.other_user = User.objects.create_user(
            email='someone.else@example.com',
            username='someoneelse',
            password='reviewpass123',
            phone='9800000002',
        )

        self.category = Category.objects.create(name='Review Shirts', slug='review-shirts')
        self.product = Product.objects.create(
            name='Review Shirt', slug='review-shirt',
            category=self.category, mrp=999, selling_price=799,
        )
        self.other_product = Product.objects.create(
            name='Unrelated Kurti', slug='unrelated-kurti',
            category=self.category, mrp=1499, selling_price=1199,
        )

        self.auth()

    def auth(self, user=None):
        refresh = RefreshToken.for_user(user or self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def set_auto_approve(self, enabled):
        config = ReviewConfig.get_config()
        config.auto_approve_reviews = enabled
        config.save(update_fields=['auto_approve_reviews'])
        return config

    def make_order(self, user=None, product=None, status='delivered', payment_status='paid'):
        order = Order.objects.create(
            order_id=f'BC-TEST-{Order.objects.count() + 1:04d}',
            user=user or self.user,
            subtotal=799, total=799,
            status=status, payment_status=payment_status,
            shipping_address={
                'full_name': 'Ravi Kumar', 'phone': '9800000001',
                'address_line1': '12 Anna Salai', 'city': 'Chennai',
                'pincode': '600001', 'state': 'Tamilnadu',
            },
        )
        OrderItem.objects.create(
            order=order,
            product=product or self.product,
            product_snapshot={'name': (product or self.product).name},
            quantity=1, price=799,
        )
        return order

    def post_review(self, rating=5, text='Solid stitching, true to size.'):
        return self.client.post(
            f'/api/products/{self.product.slug}/reviews/',
            {'rating': rating, 'text': text}, format='json',
        )

    def public_reviews(self):
        return self.client.get(f'/api/products/{self.product.slug}/reviews/')


class ReviewConfigTest(ReviewTestBase):
    def test_auto_approve_is_on_by_default(self):
        self.assertTrue(ReviewConfig.get_config().auto_approve_reviews)

    def test_get_config_is_a_singleton(self):
        first = ReviewConfig.get_config()
        second = ReviewConfig.get_config()
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(ReviewConfig.objects.count(), 1)


class ReviewModerationTest(ReviewTestBase):
    def test_review_publishes_immediately_when_auto_approve_on(self):
        res = self.post_review()
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data['is_approved'])
        self.assertTrue(Review.objects.get(user=self.user, product=self.product).is_approved)

    def test_auto_approved_review_appears_in_public_list(self):
        self.post_review(rating=4)
        res = self.public_reviews()
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_reviews'], 1)
        self.assertEqual(res.data['average_rating'], 4)

    def test_review_is_held_pending_when_auto_approve_off(self):
        self.set_auto_approve(False)
        res = self.post_review()
        self.assertEqual(res.status_code, 201)
        self.assertFalse(res.data['is_approved'])
        self.assertFalse(Review.objects.get(user=self.user, product=self.product).is_approved)

    def test_pending_review_is_hidden_from_public_list(self):
        self.set_auto_approve(False)
        self.post_review(rating=1)
        res = self.public_reviews()
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_reviews'], 0)
        self.assertEqual(res.data['results'], [])
        self.assertEqual(res.data['average_rating'], 0)

    def test_pending_review_is_visible_to_its_author_in_my_reviews(self):
        self.set_auto_approve(False)
        self.post_review()
        res = self.client.get('/api/reviews/mine/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertFalse(res.data[0]['is_approved'])

    def test_pending_review_is_excluded_from_product_rating(self):
        self.set_auto_approve(False)
        self.post_review(rating=5)
        res = self.client.get(f'/api/products/{self.product.slug}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['rating']['count'], 0)
        self.assertEqual(res.data['rating']['average'], 0)

    def test_approving_a_pending_review_publishes_it(self):
        self.set_auto_approve(False)
        self.post_review(rating=5)
        Review.objects.filter(user=self.user).update(is_approved=True)
        res = self.public_reviews()
        self.assertEqual(res.data['total_reviews'], 1)
        self.assertEqual(res.data['average_rating'], 5)

    def test_pending_review_still_blocks_a_duplicate_review(self):
        self.set_auto_approve(False)
        self.post_review()
        res = self.post_review(text='Trying again')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Review.objects.filter(user=self.user, product=self.product).count(), 1)


class VerifiedPurchaseTest(ReviewTestBase):
    def review(self):
        return Review.objects.get(user=self.user, product=self.product)

    def test_delivered_order_marks_review_verified(self):
        order = self.make_order(status='delivered', payment_status='paid')
        res = self.post_review()
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data['is_verified_purchase'])
        self.assertTrue(self.review().is_verified_purchase)
        self.assertEqual(self.review().order, order)

    def test_paid_but_undelivered_order_marks_review_verified(self):
        self.make_order(status='shipped', payment_status='paid')
        self.post_review()
        self.assertTrue(self.review().is_verified_purchase)

    def test_no_order_leaves_review_unverified(self):
        res = self.post_review()
        self.assertEqual(res.status_code, 201)
        self.assertFalse(res.data['is_verified_purchase'])
        self.assertFalse(self.review().is_verified_purchase)
        self.assertIsNone(self.review().order)

    def test_unpaid_pending_order_does_not_verify(self):
        self.make_order(status='pending', payment_status='pending')
        self.post_review()
        self.assertFalse(self.review().is_verified_purchase)

    def test_cancelled_and_refunded_order_does_not_verify(self):
        self.make_order(status='cancelled', payment_status='refunded')
        self.post_review()
        self.assertFalse(self.review().is_verified_purchase)

    def test_cancelled_order_does_not_verify_even_if_paid(self):
        self.make_order(status='cancelled', payment_status='paid')
        self.post_review()
        self.assertFalse(self.review().is_verified_purchase)

    def test_order_for_a_different_product_does_not_verify(self):
        self.make_order(product=self.other_product)
        self.post_review()
        self.assertFalse(self.review().is_verified_purchase)

    def test_another_users_order_does_not_verify(self):
        self.make_order(user=self.other_user)
        self.post_review()
        self.assertFalse(self.review().is_verified_purchase)

    def test_verified_flag_is_independent_of_moderation(self):
        self.set_auto_approve(False)
        self.make_order()
        self.post_review()
        review = self.review()
        self.assertTrue(review.is_verified_purchase)
        self.assertFalse(review.is_approved)

    def test_public_list_exposes_the_verified_flag(self):
        self.make_order()
        self.post_review()
        res = self.public_reviews()
        self.assertTrue(res.data['results'][0]['is_verified_purchase'])


class ReviewAdminActionTest(ReviewTestBase):
    def setUp(self):
        super().setUp()
        self.model_admin = ReviewAdmin(Review, AdminSite())

    def admin_request(self):
        request = RequestFactory().post('/admin/reviews/review/')
        request.user = self.user
        setattr(request, 'session', 'session')
        setattr(request, '_messages', FallbackStorage(request))
        return request

    def test_reject_action_exists_alongside_approve(self):
        self.assertIn('approve_reviews', self.model_admin.actions)
        self.assertIn('reject_reviews', self.model_admin.actions)

    def test_reject_action_unapproves_reviews(self):
        self.post_review()
        self.model_admin.reject_reviews(self.admin_request(), Review.objects.all())
        self.assertFalse(self.review_flag())

    def test_reject_action_hides_review_from_public_list(self):
        self.post_review()
        self.assertEqual(self.public_reviews().data['total_reviews'], 1)
        self.model_admin.reject_reviews(self.admin_request(), Review.objects.all())
        self.assertEqual(self.public_reviews().data['total_reviews'], 0)

    def test_approve_action_publishes_pending_reviews(self):
        self.set_auto_approve(False)
        self.post_review()
        self.assertFalse(self.review_flag())
        self.model_admin.approve_reviews(self.admin_request(), Review.objects.all())
        self.assertTrue(self.review_flag())
        self.assertEqual(self.public_reviews().data['total_reviews'], 1)

    def test_rejected_review_is_still_visible_to_its_author(self):
        self.post_review()
        self.model_admin.reject_reviews(self.admin_request(), Review.objects.all())
        res = self.client.get('/api/reviews/mine/')
        self.assertEqual(len(res.data), 1)
        self.assertFalse(res.data[0]['is_approved'])

    def review_flag(self):
        return Review.objects.get(user=self.user, product=self.product).is_approved
