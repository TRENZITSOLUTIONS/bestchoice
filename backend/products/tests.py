import io
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from PIL import Image

from .models import Category, Brand, Product, ProductVariant, ProductImage

User = get_user_model()


def make_test_image(name='test.png', size=(1600, 1600), color='blue', fmt='PNG'):
    buf = io.BytesIO()
    Image.new('RGB', size, color=color).save(buf, format=fmt)
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type=f'image/{fmt.lower()}')


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


class ProductImageCompressionTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Compression Test', slug='compression-test')
        self.product = Product.objects.create(name='Compressed Product', category=self.category, mrp=999, selling_price=699)

    def test_upload_generates_all_derived_sizes(self):
        image = ProductImage.objects.create(product=self.product, image=make_test_image())
        self.assertTrue(image.thumb)
        self.assertTrue(image.small)
        self.assertTrue(image.medium)
        self.assertTrue(image.large)

    def test_derived_sizes_are_webp_for_mobile_bandwidth(self):
        image = ProductImage.objects.create(product=self.product, image=make_test_image())
        self.assertTrue(image.thumb.name.endswith('.webp'))
        with Image.open(image.small.file) as img:
            self.assertEqual(img.format, 'WEBP')

    def test_original_is_compressed_and_capped(self):
        image = ProductImage.objects.create(product=self.product, image=make_test_image(size=(3000, 3000)))
        with Image.open(image.image.file) as img:
            self.assertLessEqual(max(img.size), 2000)

    def test_derived_sizes_are_smaller_than_original(self):
        image = ProductImage.objects.create(product=self.product, image=make_test_image(size=(1600, 1600)))
        self.assertLess(image.thumb.size, image.image.size)
        self.assertLess(image.small.size, image.image.size)

    def test_resaving_without_changing_image_does_not_regenerate(self):
        image = ProductImage.objects.create(product=self.product, image=make_test_image())
        thumb_name_before = image.thumb.name
        image.alt_text = 'Updated alt text'
        image.save()
        image.refresh_from_db()
        self.assertEqual(image.thumb.name, thumb_name_before)

    def test_replacing_image_regenerates_derived_sizes(self):
        image = ProductImage.objects.create(product=self.product, image=make_test_image(color='red'))
        thumb_name_before = image.thumb.name
        image.image = make_test_image(name='replacement.png', color='green')
        image.save()
        image.refresh_from_db()
        self.assertNotEqual(image.thumb.name, thumb_name_before)


class ProductVisibilityTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Visibility Test', slug='visibility-test')

    def test_out_of_stock_hidden_when_configured(self):
        Product.objects.create(
            name='Hidden Product', category=self.category, mrp=999, selling_price=699,
            total_stock=0, hide_if_out_of_stock=True,
        )
        res = self.client.get('/api/products/')
        names = [p['name'] for p in res.data['results']]
        self.assertNotIn('Hidden Product', names)

    def test_out_of_stock_visible_when_not_configured(self):
        Product.objects.create(
            name='Visible Out Of Stock', category=self.category, mrp=999, selling_price=699,
            total_stock=0, hide_if_out_of_stock=False,
        )
        res = self.client.get('/api/products/')
        names = [p['name'] for p in res.data['results']]
        self.assertIn('Visible Out Of Stock', names)

    def test_in_stock_never_hidden_even_if_configured(self):
        Product.objects.create(
            name='In Stock Product', category=self.category, mrp=999, selling_price=699,
            total_stock=5, hide_if_out_of_stock=True,
        )
        res = self.client.get('/api/products/')
        names = [p['name'] for p in res.data['results']]
        self.assertIn('In Stock Product', names)


class ProductFilterTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Filter Test', slug='filter-test')

        self.shirt = Product.objects.create(
            name='Cotton Slim Shirt', category=self.category, mrp=999, selling_price=699, total_stock=5,
        )
        ProductVariant.objects.create(
            product=self.shirt, color='Blue', size='M', fabric='cotton', fit='slim',
            sleeve_type='full_sleeve', occasion='formal', stock=5,
        )

        self.lipstick = Product.objects.create(
            name='Matte Lipstick', category=self.category, mrp=499, selling_price=399, total_stock=3,
        )
        ProductVariant.objects.create(
            product=self.lipstick, shade='Ruby Red', skin_type='All', stock=3,
        )

        self.charger = Product.objects.create(
            name='Fast Charger', category=self.category, mrp=799, selling_price=599, total_stock=0,
            compatible_devices='iPhone 12, iPhone 13, Samsung S21',
        )

    def _names(self, res):
        return [p['name'] for p in res.data['results']]

    def test_filter_by_fabric(self):
        res = self.client.get('/api/products/', {'fabric': 'cotton'})
        self.assertIn('Cotton Slim Shirt', self._names(res))
        self.assertNotIn('Matte Lipstick', self._names(res))

    def test_filter_by_fit(self):
        res = self.client.get('/api/products/', {'fit': 'slim'})
        self.assertIn('Cotton Slim Shirt', self._names(res))

    def test_filter_by_sleeve_type(self):
        res = self.client.get('/api/products/', {'sleeve_type': 'full_sleeve'})
        self.assertIn('Cotton Slim Shirt', self._names(res))
        self.assertNotIn('Matte Lipstick', self._names(res))

    def test_filter_by_occasion(self):
        res = self.client.get('/api/products/', {'occasion': 'formal'})
        self.assertIn('Cotton Slim Shirt', self._names(res))

    def test_filter_by_shade(self):
        res = self.client.get('/api/products/', {'shade': 'Ruby Red'})
        self.assertIn('Matte Lipstick', self._names(res))
        self.assertNotIn('Cotton Slim Shirt', self._names(res))

    def test_filter_by_skin_type(self):
        res = self.client.get('/api/products/', {'skin_type': 'All'})
        self.assertIn('Matte Lipstick', self._names(res))

    def test_filter_by_compatible_device(self):
        res = self.client.get('/api/products/', {'compatible_device': 'iPhone 12'})
        self.assertIn('Fast Charger', self._names(res))
        self.assertNotIn('Cotton Slim Shirt', self._names(res))

    def test_filter_by_availability_in_stock(self):
        res = self.client.get('/api/products/', {'availability': 'in_stock'})
        names = self._names(res)
        self.assertIn('Cotton Slim Shirt', names)
        self.assertNotIn('Fast Charger', names)

    def test_filter_by_availability_out_of_stock(self):
        res = self.client.get('/api/products/', {'availability': 'out_of_stock'})
        names = self._names(res)
        self.assertIn('Fast Charger', names)
        self.assertNotIn('Cotton Slim Shirt', names)
