from io import BytesIO

from django.core.management.base import BaseCommand
from django.db.models import Model

from products.models import ProductImage
from products.utils.image_utils import compress_original, generate_derived_sizes


class Command(BaseCommand):
    """
    Maintenance/backfill command. Images are compressed and sized automatically
    at upload time (see ProductImage.save()) - this is only needed to reprocess
    existing images, e.g. after changing compression settings.
    """
    help = 'Regenerate thumb/small/medium/large sizes for existing product images'

    def add_arguments(self, parser):
        parser.add_argument('--product-id', type=int, help='Process only this product\'s images')
        parser.add_argument('--recompress-original', action='store_true',
                             help='Also re-compress the stored original (not just the derived sizes)')

    def handle(self, *args, **options):
        qs = ProductImage.objects.all()
        if options['product_id']:
            qs = qs.filter(product_id=options['product_id'])

        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.WARNING('No product images found'))
            return

        self.stdout.write(f'Processing {total} image(s)...')
        processed = 0
        for pi in qs:
            if not pi.image:
                continue
            try:
                if options['recompress_original']:
                    compressed = compress_original(pi.image.file, pi.image.name)
                    pi.image.save(compressed.name, compressed, save=False)

                pi.image.file.seek(0)
                derived = generate_derived_sizes(BytesIO(pi.image.file.read()), pi.image.name)
                for size_name, content_file in derived.items():
                    getattr(pi, size_name).save(content_file.name, content_file, save=False)
                # Bypass ProductImage.save()'s own regenerate-on-change logic - we've
                # already done the (re)processing explicitly above.
                Model.save(pi, update_fields=['image', 'thumb', 'small', 'medium', 'large'])
                processed += 1
                self.stdout.write(f'  [{processed}/{total}] Image {pi.id} reprocessed')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Failed Image {pi.id}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Processed {processed}/{total} images'))
