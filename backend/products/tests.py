import io
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from .models import Category, Brand, Product, ProductVariant

User = get_user_model()


class SeedCategoriesTest(TestCase):
    def test_seeds_five_top_level_categories_including_mobile_accessories(self):
        call_command('seed_categories')
        top_level = Category.objects.filter(parent__isnull=True)
        self.assertEqual(top_level.count(), 5)
        self.assertTrue(Category.objects.filter(slug='mobile-accessories').exists())
        self.assertTrue(Category.objects.filter(slug='chargers', parent__slug='mobile-accessories').exists())

    def test_seed_is_idempotent(self):
        call_command('seed_categories')
        first_count = Category.objects.count()
        call_command('seed_categories')
        self.assertEqual(Category.objects.count(), first_count)

    def test_preserves_existing_categories_not_in_new_list(self):
        custom = Category.objects.create(name='Custom Category', slug='custom-category')
        call_command('seed_categories')
        self.assertTrue(Category.objects.filter(pk=custom.pk).exists())


class ProductIdGenerationTest(TestCase):
    def test_mobile_accessory_gets_mac_code(self):
        call_command('seed_categories')
        category = Category.objects.get(slug='chargers')
        product = Product.objects.create(name='Fast Charger', category=category, mrp=999, selling_price=699)
        self.assertTrue(product.auto_product_id.startswith('BC-CHG-'))


class CategorySpecificFieldsTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Cosmetics Test', slug='cosmetics-test')
        self.product = Product.objects.create(
            name='Lipstick', category=self.category, mrp=499, selling_price=399,
            batch_number='B123', ingredients='Wax, Pigment', usage_instructions='Apply gently',
            expiry_date='2027-01-01',
        )

    def test_cosmetics_fields_persist(self):
        self.product.refresh_from_db()
        self.assertEqual(self.product.batch_number, 'B123')
        self.assertEqual(str(self.product.expiry_date), '2027-01-01')

    def test_variant_clothing_and_cosmetics_fields(self):
        variant = ProductVariant.objects.create(
            product=self.product, color='Red', size='M',
            fabric='cotton', fit='slim', age_group='2-4Y', shade='Ruby Red', volume='30ml',
        )
        variant.refresh_from_db()
        self.assertEqual(variant.fabric, 'cotton')
        self.assertEqual(variant.shade, 'Ruby Red')


class ProductAdminBulkActionsTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com', username='admin', password='adminpass123', phone='9000000000',
        )
        self.client.force_login(self.admin_user)
        self.category = Category.objects.create(name='Shirts Test', slug='shirts-test')

    def test_csv_bulk_upload_creates_products(self):
        csv_content = (
            'name,category_slug,mrp,selling_price\r\n'
            f'Bulk Shirt,{self.category.slug},999,699\r\n'
        )
        csv_file = io.BytesIO(csv_content.encode('utf-8'))
        csv_file.name = 'products.csv'
        url = reverse('admin:products_product_upload_csv')
        res = self.client.post(url, {'csv_file': csv_file}, follow=True)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(Product.objects.filter(name='Bulk Shirt').exists())

    def test_csv_bulk_upload_reports_error_for_unknown_category(self):
        csv_content = 'name,category_slug,mrp,selling_price\r\nBad Row,does-not-exist,999,699\r\n'
        csv_file = io.BytesIO(csv_content.encode('utf-8'))
        csv_file.name = 'products.csv'
        url = reverse('admin:products_product_upload_csv')
        res = self.client.post(url, {'csv_file': csv_file}, follow=True)
        self.assertFalse(Product.objects.filter(name='Bad Row').exists())
        messages = [str(m) for m in res.context['messages']]
        self.assertTrue(any('unknown category_slug' in m for m in messages))

    def test_duplicate_products_admin_action(self):
        product = Product.objects.create(name='Original', category=self.category, mrp=999, selling_price=699, total_stock=5)
        ProductVariant.objects.create(product=product, color='Blue', size='L', stock=5)
        url = reverse('admin:products_product_changelist')
        res = self.client.post(url, {
            'action': 'duplicate_products',
            '_selected_action': [product.pk],
        }, follow=True)
        self.assertEqual(res.status_code, 200)
        duplicate = Product.objects.exclude(pk=product.pk).get(name='Original (Copy)')
        self.assertFalse(duplicate.is_active)
        self.assertEqual(duplicate.total_stock, 0)
        self.assertEqual(duplicate.variants.count(), 1)
        self.assertNotEqual(duplicate.variants.first().sku, product.variants.first().sku)
