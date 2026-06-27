import re
from django.db import models


CATEGORY_CODES = {
    'shirts': 'SHT', 't-shirts': 'TSH', 'jeans': 'JNS', 'trousers': 'TRS',
    'blazers': 'BLZ', 'ethnic-wear': 'ETH', 'sarees': 'SAR', 'kurtis': 'KUR',
    'dresses': 'DRS', 'tops': 'TOP', 'kids-wear': 'KID', 'cosmetics': 'COS',
}


def generate_product_id(category_slug):
    code = CATEGORY_CODES.get(category_slug, 'GEN')
    last = Product.objects.filter(auto_product_id__startswith=f'BC-{code}-').order_by('auto_product_id').last()
    if last:
        num = int(last.auto_product_id.split('-')[-1]) + 1
    else:
        num = 1
    return f'BC-{code}-{num:06d}'


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    image = models.URLField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    logo = models.URLField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    auto_product_id = models.CharField(max_length=30, unique=True, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True)
    short_description = models.TextField(blank=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    gst_included = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    hide_if_out_of_stock = models.BooleanField(default=False)
    total_stock = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.auto_product_id:
            self.auto_product_id = generate_product_id(self.category.slug if self.category else 'gen')
        if not self.slug:
            from django.utils.text import slugify
            base = slugify(self.name)[:50]
            self.slug = base
            if Product.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f'{base}-{self.auto_product_id.lower()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.auto_product_id} - {self.name}'


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.URLField(max_length=500)
    alt_text = models.CharField(max_length=200, blank=True)
    sort_order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return f'Image {self.sort_order} for {self.product.name}'


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    color = models.CharField(max_length=50, blank=True, default='')
    size = models.CharField(max_length=20, blank=True, default='')
    sku = models.CharField(max_length=50, unique=True, blank=True)
    stock = models.IntegerField(default=0)
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['color', 'size']

    def save(self, *args, **kwargs):
        if not self.sku:
            color_part = self.color.upper().replace(' ', '_') if self.color else 'NA'
            size_part = self.size.upper().replace(' ', '_') if self.size else 'NA'
            self.sku = f'{self.product.auto_product_id}-{color_part}-{size_part}'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.sku


class ProductHighlight(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='highlights')
    text = models.CharField(max_length=200)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return self.text


class RelatedProduct(models.Model):
    RELATION_TYPES = [
        ('similar', 'Similar Products'),
        ('bought_together', 'Frequently Bought Together'),
        ('recommended', 'Recommended'),
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='related_from')
    related_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='related_to')
    relation_type = models.CharField(max_length=20, choices=RELATION_TYPES)

    class Meta:
        unique_together = ('product', 'related_product', 'relation_type')

    def __str__(self):
        return f'{self.product.name} → {self.related_product.name} ({self.relation_type})'
