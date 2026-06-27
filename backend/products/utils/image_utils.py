from PIL import Image
from io import BytesIO
import uuid


SIZES = {
    'thumb': (150, 150),
    'small': (400, 400),
    'medium': (800, 800),
    'large': (1200, 1200),
}


def generate_sizes(image_file):
    """
    Takes an uploaded image file, generates 4 size variants.
    Returns dict of {size_name: BytesIO_object}
    """
    img = Image.open(image_file)
    img_format = img.format or 'JPEG'

    # Convert RGBA to RGB for JPEG
    if img_format == 'PNG' and img.mode == 'RGBA':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background

    results = {}
    for size_name, dimensions in SIZES.items():
        img_copy = img.copy()
        img_copy.thumbnail(dimensions, Image.LANCZOS)
        buffer = BytesIO()
        img_copy.save(buffer, format='JPEG', quality=85, optimize=True)
        buffer.seek(0)
        results[size_name] = buffer

    return results


def upload_to_s3(s3_client, bucket, product_id, image_id, size_buffers, cloudfront_domain):
    """
    Uploads generated size buffers to S3 and returns CloudFront URLs.
    """
    base_path = f'products/{product_id}/{image_id}'
    urls = {}

    for size_name, buffer in size_buffers.items():
        key = f'{base_path}/{size_name}.jpg'
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=buffer,
            ContentType='image/jpeg',
            CacheControl='max-age=31536000, public',
        )
        urls[size_name] = f'{cloudfront_domain}/{key}'

    return urls
