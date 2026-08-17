from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_orderstatushistory'),
    ]

    operations = [
        migrations.AddField(
            model_name='refund',
            name='item_received',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='refund',
            name='item_received_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
