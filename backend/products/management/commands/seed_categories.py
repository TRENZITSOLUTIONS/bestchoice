from django.core.management.base import BaseCommand
from django.utils.text import slugify

from products.models import Category

CATEGORY_TREE = [
    ('Men\'s Wear', 'mens-wear', [
        ('Shirts', 'shirts'),
        ('T-Shirts', 't-shirts'),
        ('Jeans', 'jeans'),
        ('Trousers', 'trousers'),
        ('Cargo Pants', 'cargo-pants'),
        ('Hoodies', 'hoodies'),
        ('Shorts', 'shorts'),
        ('Blazers', 'blazers'),
        ('Ethnic Wear', 'ethnic-wear'),
        ('Others', 'mens-others'),
    ]),
    ('Women\'s Wear', 'womens-wear', [
        ('Sarees', 'sarees'),
        ('Kurtis', 'kurtis'),
        ('Tops', 'tops'),
        ('Dresses', 'dresses'),
        ('Leggings', 'leggings'),
        ('Night Wear', 'night-wear'),
        ('Others', 'womens-others'),
    ]),
    ('Kids\' Wear', 'kids-wear', [
        ('Boys Wear', 'boys-wear'),
        ('Girls Wear', 'girls-wear'),
        ('Baby Wear', 'baby-wear'),
        ('Others', 'kids-others'),
    ]),
    ('Cosmetics', 'cosmetics', [
        ('Makeup', 'makeup'),
        ('Skincare', 'skincare'),
        ('Hair Care', 'hair-care'),
        ('Perfumes', 'perfumes'),
        ('Others', 'cosmetics-others'),
    ]),
    ('Mobile Accessories', 'mobile-accessories', [
        ('Chargers', 'chargers'),
        ('Cases & Covers', 'cases-covers'),
        ('Earphones', 'earphones'),
        ('Neckbands', 'neckbands'),
        ('Smart Watches', 'smart-watches'),
        ('Tempered Glass', 'tempered-glass'),
        ('Others', 'accessories-others'),
    ]),
]


class Command(BaseCommand):
    help = 'Seed the full Men\'s/Women\'s/Kids\'/Cosmetics/Mobile Accessories category hierarchy (idempotent).'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for sort_order, (parent_name, parent_slug, children) in enumerate(CATEGORY_TREE):
            parent, created = Category.objects.update_or_create(
                slug=parent_slug,
                defaults={'name': parent_name, 'parent': None, 'sort_order': sort_order},
            )
            created_count += created
            updated_count += not created

            for child_sort_order, (child_name, child_slug) in enumerate(children):
                _, child_created = Category.objects.update_or_create(
                    slug=slugify(child_slug),
                    defaults={'name': child_name, 'parent': parent, 'sort_order': child_sort_order},
                )
                created_count += child_created
                updated_count += not child_created

        self.stdout.write(self.style.SUCCESS(
            f'Seeded categories: {created_count} created, {updated_count} already up to date.'
        ))
