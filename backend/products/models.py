import re
from django.db import models


CATEGORY_CODES = {
    # Men's Wear
    'shirts': 'SHT', 't-shirts': 'TSH', 'jeans': 'JNS', 'trousers': 'TRS',
    'blazers': 'BLZ', 'ethnic-wear': 'ETH', 'cargo-pants': 'CGP', 'hoodies': 'HOD',
    'shorts': 'SHR', 'mens-others': 'MSO',
    # Women's Wear
    'sarees': 'SAR', 'kurtis': 'KUR', 'dresses': 'DRS', 'tops': 'TOP',
    'leggings': 'LEG', 'night-wear': 'NGW', 'womens-others': 'WSO',
    # Kids' Wear
    'kids-wear': 'KID', 'boys-wear': 'BOY', 'girls-wear': 'GRL', 'baby-wear': 'BBY',
    'kids-others': 'KSO',
    # Cosmetics
    'cosmetics': 'COS', 'makeup': 'MUP', 'skincare': 'SKC', 'hair-care': 'HRC',
    'perfumes': 'PRF', 'cosmetics-others': 'CSO',
    # Mobile Accessories
    'mobile-accessories': 'MAC', 'chargers': 'CHG', 'cases-covers': 'CAS',
    'earphones': 'EAR', 'neckbands': 'NKB', 'smart-watches': 'SWT',
    'tempered-glass': 'TMG', 'accessories-others': 'ACO',
}

# The department (top-level category) half of a SKU - CATEGORY_CODES above
# only ever covers the subcategory half (SHT, JNS, ...). A product filed
# directly under a department with no subcategory chosen falls back to GEN
# for the subcategory half, e.g. 'BC-MEN-GEN-0001'.
DEPARTMENT_CODES = {
    'mens-wear': 'MEN', 'womens-wear': 'WOM', 'kids-wear': 'KID',
    'cosmetics': 'COS', 'mobile-accessories': 'MOB',
}

# Free-typed colour/shade values ("Blue", "sky blue", "Ruby Red") need a
# stable 3-letter code for variant SKUs - this covers the common ones, and
# anything else falls back to its own first 3 letters (see abbreviate()).
COLOR_ABBREVIATIONS = {
    'black': 'BLK', 'white': 'WHT', 'blue': 'BLU', 'red': 'RED', 'green': 'GRN',
    'yellow': 'YLW', 'orange': 'ORG', 'purple': 'PRP', 'pink': 'PNK',
    'grey': 'GRY', 'gray': 'GRY', 'brown': 'BRN', 'navy': 'NVY', 'beige': 'BEG',
    'maroon': 'MRN', 'olive': 'OLV', 'gold': 'GLD', 'silver': 'SLV',
    'multicolor': 'MUL', 'multicolour': 'MUL', 'cream': 'CRM',
}

FABRIC_CHOICES = [
    ('cotton', 'Cotton'), ('linen', 'Linen'), ('viscose', 'Viscose'),
    ('denim', 'Denim'), ('polyester', 'Polyester'), ('rayon', 'Rayon'),
    ('blend', 'Blend'), ('others', 'Others'),
]

FIT_CHOICES = [
    ('regular', 'Regular'), ('slim', 'Slim'), ('oversized', 'Oversized'), ('relaxed', 'Relaxed'),
]

SLEEVE_TYPE_CHOICES = [
    ('half_sleeve', 'Half Sleeve'), ('full_sleeve', 'Full Sleeve'),
]

OCCASION_CHOICES = [
    ('casual', 'Casual'), ('formal', 'Formal'), ('party', 'Party'), ('ethnic', 'Ethnic'),
]


def department_slug_for(category):
    """Walk up to the top-level department for any category, including a
    department passed in directly (returns itself in that case)."""
    if category is None:
        return None
    node = category
    while node.parent_id:
        node = node.parent
    return node.slug


def generate_product_id():
    """PROD-000001 - a plain internal identifier, never shown to shoppers.
    One global counter across every product, independent of category."""
    last = Product.objects.order_by('-product_id').first()
    if last and last.product_id:
        num = int(last.product_id.split('-')[-1]) + 1
    else:
        num = 1
    return f'PROD-{num:06d}'


def generate_sku(category):
    """BC-MEN-SHT-0001 - the catalogue-facing code, one counter per
    department+subcategory pair (same scoping the old single-segment code
    used, just with the department segment added in front)."""
    department_slug = department_slug_for(category)
    dept_code = DEPARTMENT_CODES.get(department_slug, 'GEN')
    subcat_code = CATEGORY_CODES.get(category.slug, 'GEN') if category else 'GEN'
    prefix = f'BC-{dept_code}-{subcat_code}-'
    last = Product.objects.filter(sku__startswith=prefix).order_by('sku').last()
    if last:
        num = int(last.sku.split('-')[-1]) + 1
    else:
        num = 1
    return f'{prefix}{num:04d}'


def generate_variant_id():
    """VAR-000001 - one global counter across every variant of every
    product, not scoped per-product."""
    last = ProductVariant.objects.order_by('-variant_id').first()
    if last and last.variant_id:
        num = int(last.variant_id.split('-')[-1]) + 1
    else:
        num = 1
    return f'VAR-{num:06d}'


def abbreviate(value):
    """A stable 3-letter code for a free-typed colour/shade value - looked up
    first, then falls back to the value's own first 3 letters so an unlisted
    colour still gets a short, consistent code instead of breaking."""
    if not value:
        return ''
    key = value.strip().lower()
    return COLOR_ABBREVIATIONS.get(key, re.sub(r'[^A-Za-z0-9]', '', value).upper()[:3])


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
    # Two distinct identifiers, not one: product_id (PROD-000001) is a plain
    # internal reference that's never shown to a shopper; sku (BC-MEN-SHT-0001)
    # is the catalogue-facing code variant SKUs are built from. Both are
    # auto-generated in save() below - never settable by staff.
    product_id = models.CharField(max_length=20, unique=True, editable=False)
    sku = models.CharField(max_length=30, unique=True, editable=False)
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
    # Denormalised sum of variant stock, kept in step by ProductVariant.save()/delete().
    # It is a stored column rather than a property because visible_to_customers()
    # filters on it in SQL. Products with no variants hold their own value here.
    total_stock = models.IntegerField(default=0)
    weight_g = models.IntegerField(default=500, help_text='Weight in grams')

    # Cosmetics-specific
    expiry_date = models.DateField(null=True, blank=True)
    batch_number = models.CharField(max_length=50, blank=True, default='')
    ingredients = models.TextField(blank=True, default='')
    usage_instructions = models.TextField(blank=True, default='')

    # Clothing-specific (Men's / Women's / Kids' Wear)
    care_instructions = models.TextField(blank=True, default='')

    # Mobile Accessories-specific
    compatible_devices = models.TextField(blank=True, default='', help_text='Comma-separated list of compatible devices')
    warranty = models.CharField(max_length=100, blank=True, default='', help_text='e.g. "6 months" (optional)')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.product_id:
            self.product_id = generate_product_id()
        if not self.sku:
            self.sku = generate_sku(self.category)
        if not self.slug:
            from django.utils.text import slugify
            base = slugify(self.name)[:50]
            self.slug = base
            if Product.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f'{base}-{self.sku.lower()}'
        super().save(*args, **kwargs)

    def sync_total_stock(self, force=False):
        """Recompute total_stock from this product's variants.

        No-op for products that have never had a variant - there total_stock is
        the authoritative value, set directly, and recomputing would zero it
        out. `force=True` skips that guard for the one caller that needs to:
        deleting a product's last variant must reset stock to 0, not leave it
        stuck at whatever the total was before that variant disappeared - a
        real bug this method used to have, since at that point
        `self.variants.exists()` is already False.
        Writes with .update() to avoid recursing through save().
        """
        if not force and not self.variants.exists():
            return
        total = self.variants.aggregate(total=models.Sum('stock'))['total'] or 0
        if total != self.total_stock:
            Product.objects.filter(pk=self.pk).update(total_stock=total)
            self.total_stock = total

    def __str__(self):
        return f'{self.sku} - {self.name}'


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/original/')
    thumb = models.ImageField(upload_to='products/thumb/', blank=True, editable=False)
    small = models.ImageField(upload_to='products/small/', blank=True, editable=False)
    medium = models.ImageField(upload_to='products/medium/', blank=True, editable=False)
    large = models.ImageField(upload_to='products/large/', blank=True, editable=False)
    alt_text = models.CharField(max_length=200, blank=True)
    sort_order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ['sort_order']

    def _image_changed(self):
        if not self.image:
            return False
        if not self.pk:
            return True
        old = ProductImage.objects.filter(pk=self.pk).values_list('image', flat=True).first()
        return old != self.image.name

    def save(self, *args, **kwargs):
        from io import BytesIO
        from .utils.image_utils import compress_original, generate_derived_sizes

        regenerate = self._image_changed()
        compressed_bytes = None
        if regenerate:
            compressed = compress_original(self.image.file, self.image.name)
            compressed_bytes = compressed.read()
            compressed.seek(0)
            self.image = compressed

        super().save(*args, **kwargs)

        if regenerate:
            # Reuse the already-compressed bytes rather than re-reading self.image from
            # storage post-save (which would mean a network round trip when using S3).
            derived = generate_derived_sizes(BytesIO(compressed_bytes), self.image.name)
            for size_name, content_file in derived.items():
                getattr(self, size_name).save(content_file.name, content_file, save=False)
            super().save(update_fields=['thumb', 'small', 'medium', 'large'])

    def __str__(self):
        return f'Image {self.sort_order} for {self.product.name}'


class ProductVariant(models.Model):
    # VAR-000001 - a plain internal reference, auto-generated in save() below.
    # One global counter across every variant of every product (not
    # per-product), matching product_id's scope on Product.
    variant_id = models.CharField(max_length=20, unique=True, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    color = models.CharField(max_length=50, blank=True, default='')
    size = models.CharField(max_length=20, blank=True, default='')

    # Clothing-specific (Men's / Women's / Kids' Wear)
    fabric = models.CharField(max_length=20, blank=True, default='', choices=FABRIC_CHOICES)
    fit = models.CharField(max_length=20, blank=True, default='', choices=FIT_CHOICES)
    age_group = models.CharField(max_length=30, blank=True, default='', help_text='Kids\' Wear only, e.g. "2-4Y"')
    sleeve_type = models.CharField(max_length=20, blank=True, default='', choices=SLEEVE_TYPE_CHOICES)
    occasion = models.CharField(max_length=20, blank=True, default='', choices=OCCASION_CHOICES)

    # Cosmetics-specific
    shade = models.CharField(max_length=50, blank=True, default='')
    volume = models.CharField(max_length=30, blank=True, default='', help_text='e.g. "30ml", "100ml"')
    skin_type = models.CharField(max_length=30, blank=True, default='', help_text='Optional, e.g. "Oily", "Dry", "All"')

    sku = models.CharField(max_length=50, unique=True, blank=True)
    stock = models.IntegerField(default=0)
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['color', 'size']

    def build_sku(self):
        """Derive a SKU from whichever variant axes this product actually uses.

        Clothing varies by colour + size, cosmetics by shade + volume. Building
        the suffix from only colour and size meant every shade of a lipstick
        collapsed to the same '<id>-NA-NA' SKU and tripped the unique
        constraint, so a cosmetic could never have more than one shade. Falls
        back to a counter if two variants still collide.
        """
        def part(value):
            return value.upper().replace(' ', '_') if value else ''

        # Colour and shade are free-typed ("Sky Blue", "Ruby Red") so they go
        # through abbreviate() for a stable 3-letter code (BLU, RED); size and
        # volume are already compact (S/M/L, 30ml) and just get uppercased.
        axes = [abbreviate(self.color), part(self.size), abbreviate(self.shade), part(self.volume)]
        suffix = '-'.join(a for a in axes if a) or 'STD'
        base = f'{self.product.sku}-{suffix}'

        candidate, n = base, 2
        taken = ProductVariant.objects.exclude(pk=self.pk)
        while taken.filter(sku=candidate).exists():
            candidate = f'{base}-{n}'
            n += 1
        return candidate

    def save(self, *args, **kwargs):
        if not self.variant_id:
            self.variant_id = generate_variant_id()
        if not self.sku:
            self.sku = self.build_sku()
        super().save(*args, **kwargs)
        self.product.sync_total_stock()

    def delete(self, *args, **kwargs):
        product = self.product
        super().delete(*args, **kwargs)
        product.sync_total_stock(force=True)

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
