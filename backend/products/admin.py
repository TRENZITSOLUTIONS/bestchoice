import csv
import io

from django.contrib import admin, messages
from django.shortcuts import redirect, render
from django.urls import path

from .admin_forms import ProductCSVUploadForm
from .models import Category, Brand, Product, ProductImage, ProductVariant, ProductHighlight, RelatedProduct

PRODUCT_CSV_FIELDS = [
    'name', 'category_slug', 'brand_slug', 'short_description', 'description',
    'mrp', 'selling_price', 'gst_included', 'weight_g', 'hide_if_out_of_stock',
    'care_instructions', 'expiry_date', 'batch_number', 'ingredients',
    'usage_instructions', 'compatible_devices', 'warranty',
]
PRODUCT_CSV_BOOL_FIELDS = {'gst_included', 'hide_if_out_of_stock'}
PRODUCT_CSV_REQUIRED_FIELDS = {'name', 'category_slug', 'mrp', 'selling_price'}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 2


class ProductHighlightInline(admin.TabularInline):
    model = ProductHighlight
    extra = 3


class RelatedProductInline(admin.TabularInline):
    model = RelatedProduct
    fk_name = 'product'
    extra = 2


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'is_active', 'sort_order')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


def _parse_bool(value: str) -> bool:
    return (value or '').strip().lower() in ('1', 'true', 'yes', 'y')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('auto_product_id', 'name', 'category', 'selling_price', 'mrp', 'total_stock', 'is_active')
    list_filter = ('is_active', 'category', 'brand')
    search_fields = ('name', 'auto_product_id')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductVariantInline, ProductHighlightInline, RelatedProductInline]
    readonly_fields = ('auto_product_id', 'total_stock')
    actions = ['duplicate_products']
    change_list_template = 'admin/products/product/change_list.html'

    def get_urls(self):
        custom_urls = [
            path('upload-csv/', self.admin_site.admin_view(self.upload_csv), name='products_product_upload_csv'),
        ]
        return custom_urls + super().get_urls()

    def upload_csv(self, request):
        if request.method == 'POST':
            form = ProductCSVUploadForm(request.POST, request.FILES)
            if form.is_valid():
                created, errors = self._import_products_csv(form.cleaned_data['csv_file'])
                if created:
                    messages.success(request, f'Created {created} product(s).')
                for error in errors:
                    messages.error(request, error)
                return redirect('..')
        else:
            form = ProductCSVUploadForm()

        context = {
            **self.admin_site.each_context(request),
            'form': form,
            'fields': PRODUCT_CSV_FIELDS,
            'opts': self.model._meta,
            'title': 'Bulk upload products (CSV)',
        }
        return render(request, 'admin/products/product/csv_upload.html', context)

    def _import_products_csv(self, uploaded_file):
        decoded = uploaded_file.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(decoded))
        created = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            missing = [f for f in PRODUCT_CSV_REQUIRED_FIELDS if not (row.get(f) or '').strip()]
            if missing:
                errors.append(f'Row {row_num}: missing required field(s) {", ".join(missing)}')
                continue

            category = Category.objects.filter(slug=row['category_slug'].strip()).first()
            if not category:
                errors.append(f'Row {row_num}: unknown category_slug "{row["category_slug"]}"')
                continue

            brand = None
            brand_slug = (row.get('brand_slug') or '').strip()
            if brand_slug:
                brand = Brand.objects.filter(slug=brand_slug).first()
                if not brand:
                    errors.append(f'Row {row_num}: unknown brand_slug "{brand_slug}"')
                    continue

            try:
                product_kwargs = {
                    'name': row['name'].strip(),
                    'category': category,
                    'brand': brand,
                    'short_description': row.get('short_description', ''),
                    'description': row.get('description', ''),
                    'mrp': row['mrp'],
                    'selling_price': row['selling_price'],
                    'weight_g': int(row['weight_g']) if (row.get('weight_g') or '').strip() else 500,
                    'care_instructions': row.get('care_instructions', ''),
                    'batch_number': row.get('batch_number', ''),
                    'ingredients': row.get('ingredients', ''),
                    'usage_instructions': row.get('usage_instructions', ''),
                    'compatible_devices': row.get('compatible_devices', ''),
                    'warranty': row.get('warranty', ''),
                }
                for bool_field in PRODUCT_CSV_BOOL_FIELDS:
                    if (row.get(bool_field) or '').strip():
                        product_kwargs[bool_field] = _parse_bool(row[bool_field])
                if (row.get('expiry_date') or '').strip():
                    product_kwargs['expiry_date'] = row['expiry_date'].strip()

                Product.objects.create(**product_kwargs)
                created += 1
            except Exception as exc:
                errors.append(f'Row {row_num}: {exc}')

        return created, errors

    @admin.action(description='Duplicate selected products')
    def duplicate_products(self, request, queryset):
        duplicated = 0
        for product in queryset:
            images = list(product.images.all())
            variants = list(product.variants.all())
            highlights = list(product.highlights.all())

            product.pk = None
            product.auto_product_id = ''
            product.slug = ''
            product.name = f'{product.name} (Copy)'
            product.is_active = False
            product.total_stock = 0
            product.save()

            for image in images:
                image.pk = None
                image.product = product
                image.save()

            for variant in variants:
                variant.pk = None
                variant.product = product
                variant.sku = ''
                variant.stock = 0
                variant.save()

            for highlight in highlights:
                highlight.pk = None
                highlight.product = product
                highlight.save()

            duplicated += 1

        self.message_user(request, f'Duplicated {duplicated} product(s) as inactive drafts.', messages.SUCCESS)
