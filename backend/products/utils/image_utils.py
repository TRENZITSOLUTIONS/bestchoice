from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

ORIGINAL_MAX_DIMENSIONS = (2000, 2000)
ORIGINAL_QUALITY = 90

DERIVED_SIZES = {
    'thumb': (150, 150),
    'small': (400, 400),
    'medium': (800, 800),
    'large': (1200, 1200),
}
# WebP: meaningfully smaller than JPEG at equivalent visual quality - matters most
# on the mobile/3G-4G connections most customers actually browse on.
DERIVED_QUALITY = 80


def _load_rgb(file_obj):
    file_obj.seek(0)
    img = Image.open(file_obj)
    img = ImageOps.exif_transpose(img)
    if img.mode in ('RGBA', 'P', 'LA'):
        rgba = img.convert('RGBA')
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.split()[-1])
        img = background
    else:
        img = img.convert('RGB')
    return img


def compress_original(file_obj, name):
    """Re-encode an uploaded image at a capped resolution/quality so the stored
    'original' itself is already web-optimized, not a raw multi-MB camera photo."""
    img = _load_rgb(file_obj)
    img.thumbnail(ORIGINAL_MAX_DIMENSIONS, Image.Resampling.LANCZOS)
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=ORIGINAL_QUALITY, optimize=True)
    base_name = name.rsplit('.', 1)[0]
    return ContentFile(buf.getvalue(), name=f'{base_name}.jpg')


def generate_derived_sizes(file_obj, name):
    """Build thumb/small/medium/large WebP variants from an (already-compressed) image."""
    img = _load_rgb(file_obj)
    base_name = name.rsplit('.', 1)[0]
    results = {}
    for size_name, dimensions in DERIVED_SIZES.items():
        img_copy = img.copy()
        img_copy.thumbnail(dimensions, Image.Resampling.LANCZOS)
        buf = BytesIO()
        img_copy.save(buf, format='WEBP', quality=DERIVED_QUALITY, method=6)
        results[size_name] = ContentFile(buf.getvalue(), name=f'{base_name}_{size_name}.webp')
    return results
