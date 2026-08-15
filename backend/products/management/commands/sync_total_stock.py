from django.core.management.base import BaseCommand

from products.models import Product


class Command(BaseCommand):
    help = (
        'Recompute Product.total_stock from variant stock. One-off backfill for rows '
        'created before total_stock was kept in sync automatically.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true',
                            help='Report what would change without writing.')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        changed = 0

        for product in Product.objects.prefetch_related('variants'):
            if not product.variants.exists():
                continue
            before = product.total_stock
            after = sum(v.stock for v in product.variants.all())
            if before == after:
                continue

            changed += 1
            self.stdout.write(f'{product.sku} {product.name}: {before} -> {after}')
            if not dry_run:
                product.sync_total_stock()

        if dry_run:
            self.stdout.write(self.style.WARNING(f'Dry run: {changed} product(s) would change.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Synced {changed} product(s).'))
