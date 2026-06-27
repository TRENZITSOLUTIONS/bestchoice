from django.db import models


class DeliveryPincode(models.Model):
    DELIVERY_CHOICES = [
        ('same_day', 'Same Day'),
        ('standard', 'Standard'),
        ('none', 'Not Available'),
    ]

    pincode = models.CharField(max_length=6, unique=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=50, default='Tamilnadu')
    delivery_type = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='standard')
    estimated_days_text = models.CharField(max_length=50, blank=True)
    store_pickup_available = models.BooleanField(default=False)
    cod_available = models.BooleanField(default=True)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.pincode} - {self.city}'
