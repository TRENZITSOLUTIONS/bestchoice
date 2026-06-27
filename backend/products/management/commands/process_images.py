import os
import io
import urllib.request
from PIL import Image
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from products.models import ProductImage


SIZES = {
    'thumb': (150, 150),
    'small': (400, 400),
    'medium': (800, 800),
    'large': (1200, 1200),
}


def resize_image(image_data, max_size):
    img = Image.open(io.BytesIO(image_data))
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return buf.getvalue()


def process_product_image(product_image, force=False):
    source_url = product_image.image
    if not source_url:
        return None

    # Download original
    try:
        resp = urllib.request.urlopen(source_url)
        original_data = resp.read()
    except Exception as e:
        raise CommandError(f'Failed to download {source_url}: {e}')

    prefix = f'products/{product_image.product.auto_product_id}/{product_image.id}'
    results = {'original': source_url}

    # If CloudFront is configured, reconstruct S3 path from URL
    if settings.AWS_CLOUDFRONT_DOMAIN and settings.AWS_STORAGE_BUCKET_NAME:
        # Already stored on S3; just generate sizes
        for size_name, (w, h) in SIZES.items():
            resized = resize_image(original_data, (w, h))
            path = f'{prefix}/{size_name}.jpg'
            saved_path = default_storage.save(path, ContentFile(resized))
            url = f'{settings.AWS_CLOUDFRONT_DOMAIN}/{saved_path}'
            results[size_name] = url
    else:
        # Local storage fallback
        local_dir = os.path.join(settings.MEDIA_ROOT, prefix)
        os.makedirs(local_dir, exist_ok=True)
        for size_name, (w, h) in SIZES.items():
            resized = resize_image(original_data, (w, h))
            path = os.path.join(local_dir, f'{size_name}.jpg')
            with open(path, 'wb') as f:
                f.write(resized)
            results[size_name] = f'{settings.MEDIA_URL}{prefix}/{size_name}.jpg'

    return results


class Command(BaseCommand):
    help = 'Generate 4 image sizes (thumb/small/medium/large) for product images'

    def add_arguments(self, parser):
        parser.add_argument('--product-id', type=int, help='Process only this product image ID')
        parser.add_argument('--force', action='store_true', help='Regenerate existing sizes')

    def handle(self, *args, **options):
        qs = ProductImage.objects.all()
        if options['product_id']:
            qs = qs.filter(id=options['product_id'])

        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.WARNING('No product images found'))
            return

        self.stdout.write(f'Processing {total} image(s)...')
        processed = 0
        for pi in qs:
            try:
                result = process_product_image(pi, force=options['force'])
                if result:
                    processed += 1
                    self.stdout.write(f'  [{processed}/{total}] Image {pi.id}: thumb={result.get("thumb", "?")[:60]}...')
            except CommandError as e:
                self.stdout.write(self.style.ERROR(f'  Failed Image {pi.id}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Processed {processed}/{total} images'))
