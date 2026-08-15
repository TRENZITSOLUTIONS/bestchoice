from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0006_wipe_existing_catalog'),
    ]

    operations = [
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
