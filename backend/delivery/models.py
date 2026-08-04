from django.db import models


class DeliveryPincode(models.Model):
    # These are price zones, not speeds. Same-day delivery is not offered - the
    # shipping policy quotes 2-4 business days across Tamil Nadu - so 'local'
    # only means "near the Chennai store, therefore cheaper to deliver to".
    DELIVERY_CHOICES = [
        ('local', 'Local (Chennai metro)'),
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


class OutsideStateDeliveryRate(models.Model):
    """
    Single configurable rate card for delivery outside Tamil Nadu.
    Tamil Nadu pincodes are priced per-pincode via DeliveryPincode instead.
    """
    base_charge = models.DecimalField(max_digits=10, decimal_places=2, default=150)
    free_delivery_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=1000)
    estimated_days_text = models.CharField(max_length=50, default='5-8 business days')
    cod_available = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, help_text='If off, orders outside Tamil Nadu are rejected at checkout')

    class Meta:
        verbose_name = 'Outside Tamil Nadu delivery rate'
        verbose_name_plural = 'Outside Tamil Nadu delivery rate'

    def __str__(self):
        return f'Outside Tamil Nadu — ₹{self.base_charge} ({"active" if self.is_active else "inactive"})'

    @classmethod
    def get_config(cls):
        config = cls.objects.first()
        if config is None:
            config = cls.objects.create()
        return config
