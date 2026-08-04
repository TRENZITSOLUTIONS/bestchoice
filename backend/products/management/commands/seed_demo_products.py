from decimal import Decimal

from django.core.management.base import BaseCommand

from products.models import Brand, Category, Product, ProductVariant

COLORS = ['Black', 'White', 'Navy', 'Maroon', 'Beige', 'Olive', 'Grey', 'Mustard']
SIZES_ADULT = ['S', 'M', 'L', 'XL', 'XXL']
SIZES_KIDS = ['2-4Y', '4-6Y', '6-8Y', '8-10Y']

# (name, subcategory slug, mrp, price, fabric, fit, sleeve_type, occasion, colors, sizes)
CLOTHING_PRODUCTS = [
    ('Classic Oxford Shirt', 'shirts', 1499, 999, 'cotton', 'regular', 'full_sleeve', 'formal', COLORS[:4], SIZES_ADULT),
    ('Everyday Crew Neck Tee', 't-shirts', 799, 499, 'cotton', 'regular', 'half_sleeve', 'casual', COLORS, SIZES_ADULT),
    ('Slim Stretch Denim', 'jeans', 2199, 1499, 'denim', 'slim', '', 'casual', ['Black', 'Navy', 'Grey'], SIZES_ADULT),
    ('Tapered Chino Trousers', 'trousers', 1799, 1199, 'cotton', 'regular', '', 'formal', ['Beige', 'Navy', 'Black'], SIZES_ADULT),
    ('Two-Button Blazer', 'blazers', 4999, 3499, 'blend', 'slim', 'full_sleeve', 'formal', ['Black', 'Navy'], SIZES_ADULT),
    ('Kurta Pyjama Set', 'ethnic-wear', 2499, 1799, 'cotton', 'regular', 'full_sleeve', 'ethnic', ['White', 'Beige', 'Maroon'], SIZES_ADULT),
    ('Utility Cargo Pants', 'cargo-pants', 1899, 1299, 'cotton', 'relaxed', '', 'casual', ['Olive', 'Black', 'Grey'], SIZES_ADULT),
    ('Fleece Pullover Hoodie', 'hoodies', 1999, 1399, 'blend', 'oversized', 'full_sleeve', 'casual', COLORS[:5], SIZES_ADULT),
    ('Cotton Bermuda Shorts', 'shorts', 899, 599, 'cotton', 'regular', '', 'casual', ['Black', 'Navy', 'Grey'], SIZES_ADULT),
    ('Silk-Blend Banarasi Saree', 'sarees', 3999, 2799, 'blend', '', '', 'ethnic', ['Maroon', 'Navy', 'Mustard'], []),
    ('Printed Anarkali Kurti', 'kurtis', 1699, 1099, 'rayon', 'relaxed', 'full_sleeve', 'ethnic', ['White', 'Mustard', 'Maroon'], SIZES_ADULT),
    ('A-Line Midi Dress', 'dresses', 2199, 1499, 'viscose', 'regular', 'half_sleeve', 'party', ['Black', 'Maroon', 'Navy'], SIZES_ADULT),
    ('Casual Wrap Top', 'tops', 999, 649, 'cotton', 'regular', 'half_sleeve', 'casual', COLORS[:5], SIZES_ADULT),
    ('High-Waist Leggings', 'leggings', 799, 549, 'cotton', 'slim', '', 'casual', ['Black', 'Navy', 'Grey'], SIZES_ADULT),
    ('Satin Night Suit', 'night-wear', 1299, 899, 'polyester', 'relaxed', 'full_sleeve', 'casual', ['Navy', 'Maroon'], SIZES_ADULT),
    ('Boys Printed Half-Sleeve Shirt', 'boys-wear', 799, 549, 'cotton', 'regular', 'half_sleeve', 'casual', COLORS[:4], SIZES_KIDS),
    ('Girls Cotton Frock', 'girls-wear', 999, 699, 'cotton', 'regular', 'half_sleeve', 'party', ['White', 'Mustard', 'Maroon'], SIZES_KIDS),
    ('Infant Cotton Romper', 'baby-wear', 599, 399, 'cotton', 'relaxed', 'half_sleeve', 'casual', ['White', 'Beige', 'Grey'], ['0-6M', '6-12M', '12-18M']),
]

# (name, subcategory slug, mrp, price, shade options, volume, skin_type)
COSMETICS_PRODUCTS = [
    ('Matte Liquid Lipstick', 'makeup', 599, 399, ['Rustic Red', 'Nude Beige', 'Berry Wine'], '', ''),
    ('Full Coverage Foundation', 'makeup', 899, 649, ['Ivory', 'Sand', 'Caramel'], '30ml', 'all'),
    ('Hydrating Face Serum', 'skincare', 1199, 849, [], '30ml', 'dry'),
    ('Oil-Control Face Wash', 'skincare', 449, 299, [], '100ml', 'oily'),
    ('Argan Hair Oil', 'hair-care', 549, 379, [], '200ml', ''),
    ('Anti-Dandruff Shampoo', 'hair-care', 399, 279, [], '340ml', ''),
    ('Eau De Parfum - Floral', 'perfumes', 2499, 1799, [], '100ml', ''),
    ('Body Mist - Citrus', 'perfumes', 699, 449, [], '150ml', ''),
]

# (name, subcategory slug, mrp, price, compatible_devices, warranty)
MOBILE_PRODUCTS = [
    ('65W Fast Charger', 'chargers', 1499, 999, 'Android, iPhone (with USB-C cable)', '12 months'),
    ('20W USB-C Wall Adapter', 'chargers', 899, 599, 'Android, iPhone 15+', '6 months'),
    ('Silicone Back Cover', 'cases-covers', 499, 299, 'iPhone 13, 14, 15', ''),
    ('Rugged Armor Case', 'cases-covers', 799, 549, 'Samsung Galaxy S23, S24', '3 months'),
    ('Wireless Bluetooth Earphones', 'earphones', 2999, 1999, 'Universal Bluetooth 5.0', '12 months'),
    ('Wired In-Ear Earphones', 'earphones', 599, 399, 'Universal 3.5mm / USB-C', '6 months'),
    ('Magnetic Neckband', 'neckbands', 1799, 1199, 'Universal Bluetooth 5.2', '12 months'),
    ('Fitness Smart Watch', 'smart-watches', 3499, 2299, 'Android, iOS', '12 months'),
    ('9H Tempered Glass', 'tempered-glass', 299, 149, 'iPhone 13, 14, 15', ''),
    ('Privacy Tempered Glass', 'tempered-glass', 399, 249, 'Samsung Galaxy S23, S24', ''),
]


class Command(BaseCommand):
    help = 'Seed demo products across all five categories (no images - none available yet).'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Delete existing demo products first (matched by name).')

    def handle(self, *args, **options):
        brand, _ = Brand.objects.get_or_create(slug='bestchoice-house', defaults={'name': 'Best Choice House Brand'})

        all_names = (
            [p[0] for p in CLOTHING_PRODUCTS]
            + [p[0] for p in COSMETICS_PRODUCTS]
            + [p[0] for p in MOBILE_PRODUCTS]
        )
        if options['clear']:
            deleted, _ = Product.objects.filter(name__in=all_names).delete()
            self.stdout.write(self.style.WARNING(f'Cleared {deleted} existing row(s) for these demo products.'))

        created, skipped, missing_categories = 0, 0, set()

        for name, cat_slug, mrp, price, fabric, fit, sleeve, occasion, colors, sizes in CLOTHING_PRODUCTS:
            category = Category.objects.filter(slug=cat_slug).first()
            if not category:
                missing_categories.add(cat_slug)
                continue
            if Product.objects.filter(name=name).exists():
                skipped += 1
                continue

            product = Product.objects.create(
                name=name, category=category, brand=brand,
                mrp=Decimal(mrp), selling_price=Decimal(price),
                short_description=f'{name} - {category.name.rstrip("s") if category.name.endswith("s") else category.name} from Best Choice.',
                care_instructions='Machine wash cold, do not bleach, tumble dry low.',
            )
            variant_combos = [(c, s) for c in colors for s in sizes] or [(c, '') for c in colors] or [('', s) for s in sizes]
            for color, size in variant_combos:
                ProductVariant.objects.create(
                    product=product, color=color, size=size, stock=25,
                    fabric=fabric, fit=fit, sleeve_type=sleeve, occasion=occasion,
                )
            created += 1

        for name, cat_slug, mrp, price, shades, volume, skin_type in COSMETICS_PRODUCTS:
            category = Category.objects.filter(slug=cat_slug).first()
            if not category:
                missing_categories.add(cat_slug)
                continue
            if Product.objects.filter(name=name).exists():
                skipped += 1
                continue

            product = Product.objects.create(
                name=name, category=category, brand=brand,
                mrp=Decimal(mrp), selling_price=Decimal(price),
                short_description=f'{name} from Best Choice.',
                usage_instructions='Patch test before first use. For external use only.',
                ingredients='Full ingredient list on packaging.',
            )
            if shades:
                for shade in shades:
                    ProductVariant.objects.create(
                        product=product, shade=shade, volume=volume, skin_type=skin_type, stock=40,
                    )
            else:
                ProductVariant.objects.create(product=product, volume=volume, skin_type=skin_type, stock=40)
            created += 1

        for name, cat_slug, mrp, price, compatible, warranty in MOBILE_PRODUCTS:
            category = Category.objects.filter(slug=cat_slug).first()
            if not category:
                missing_categories.add(cat_slug)
                continue
            if Product.objects.filter(name=name).exists():
                skipped += 1
                continue

            product = Product.objects.create(
                name=name, category=category, brand=brand,
                mrp=Decimal(mrp), selling_price=Decimal(price),
                short_description=f'{name} from Best Choice.',
                compatible_devices=compatible, warranty=warranty,
            )
            for color in ['Black', 'White']:
                ProductVariant.objects.create(product=product, color=color, stock=30)
            created += 1

        if missing_categories:
            self.stdout.write(self.style.ERROR(
                f'Skipped - category slug(s) not found (run seed_categories first): {", ".join(sorted(missing_categories))}'
            ))
        self.stdout.write(self.style.SUCCESS(f'Created {created} product(s), skipped {skipped} already present.'))
