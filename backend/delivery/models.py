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


class TamilNaduDeliveryRate(models.Model):
    """Editable rate card for the Tamil Nadu zone.

    These were hardcoded constants in delivery/utils.py, so changing a delivery
    price meant a code deploy. A pincode's own `delivery_charge` still overrides
    the zone charge when set.
    """
    local_charge = models.DecimalField(
        max_digits=10, decimal_places=2, default=30,
        help_text='Charge for pincodes on the "Local (Chennai metro)" zone.',
    )
    standard_charge = models.DecimalField(
        max_digits=10, decimal_places=2, default=80,
        help_text='Charge for pincodes on the "Standard" zone.',
    )
    free_delivery_threshold = models.DecimalField(
        max_digits=10, decimal_places=2, default=500,
        help_text='Order subtotal at or above which Tamil Nadu delivery is free.',
    )
    weight_surcharge_per_500g = models.DecimalField(
        max_digits=10, decimal_places=2, default=10,
        help_text='Added per 500g (or part of) above the weight allowance.',
    )
    weight_allowance_g = models.PositiveIntegerField(
        default=1000,
        help_text='Order weight in grams before the surcharge starts applying.',
    )
    estimated_days_text = models.CharField(
        max_length=50, default='2-4 business days',
        help_text='Fallback estimate for pincodes with none of their own.',
    )

    class Meta:
        verbose_name = 'Tamil Nadu delivery rate'
        verbose_name_plural = 'Tamil Nadu delivery rate'

    def __str__(self):
        return f'Tamil Nadu — local ₹{self.local_charge} / standard ₹{self.standard_charge}'

    @classmethod
    def get_config(cls):
        config = cls.objects.first()
        if config is None:
            config = cls.objects.create()
        return config

    def charge_for(self, delivery_type):
        return self.local_charge if delivery_type == 'local' else self.standard_charge


class OutsideStateDeliveryRate(models.Model):
    """
    Single configurable rate card for delivery outside Tamil Nadu.
    Tamil Nadu pincodes are priced per-pincode via DeliveryPincode instead.
    """
    base_charge = models.DecimalField(max_digits=10, decimal_places=2, default=150)
    free_delivery_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=1000)
    weight_surcharge_per_500g = models.DecimalField(
        max_digits=10, decimal_places=2, default=10,
        help_text='Added per 500g (or part of) above the weight allowance.',
    )
    weight_allowance_g = models.PositiveIntegerField(
        default=1000,
        help_text='Order weight in grams before the surcharge starts applying.',
    )
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
