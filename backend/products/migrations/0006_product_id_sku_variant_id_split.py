from django.db import migrations, models


def wipe_existing_catalog(apps, schema_editor):
    """The old single auto_product_id field is being split into product_id
    (PROD-000001) + sku (BC-MEN-SHT-0001), and every variant is getting its
    own variant_id (VAR-000001) - explicit call from the store owner to
    start that numbering fresh rather than backfill the handful of existing
    demo products into the new scheme.

    Deleting Product cascades (via Django's ORM collector, not a raw SQL
    FK cascade) to ProductImage/ProductVariant/ProductHighlight/RelatedProduct,
    CartItem, Review and WishlistItem; OrderItem.product/variant are
    SET_NULL, so any real order history is untouched - each OrderItem
    already carries its own product_snapshot JSON captured at checkout time.
    """
    Product = apps.get_model('products', 'Product')
    Product.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_productvariant_occasion_productvariant_skin_type_and_more'),
        # Only needed so the historical app registry this RunPython step runs
        # against already has these apps' Product/ProductVariant foreign keys
        # (SET_NULL on orders.OrderItem, CASCADE elsewhere) resolved.
        ('orders', '0002_orderstatushistory'),
        ('cart', '0002_cart_coupon'),
        ('wishlist', '0001_initial'),
        ('reviews', '0002_reviewconfig'),
    ]

    operations = [
        migrations.RunPython(wipe_existing_catalog, migrations.RunPython.noop),
        migrations.RenameField(
            model_name='product',
            old_name='auto_product_id',
            new_name='sku',
        ),
        migrations.AddField(
            model_name='product',
            name='product_id',
            field=models.CharField(editable=False, max_length=20, unique=True),
        ),
        migrations.AddField(
            model_name='productvariant',
            name='variant_id',
            field=models.CharField(editable=False, max_length=20, unique=True),
        ),
    ]
