from django.db import models
from django.conf import settings


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('packed', 'Packed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
        ('failed', 'Failed'),
    ]
    DELIVERY_CHOICES = [
        ('home', 'Home Delivery'),
        ('store_pickup', 'Store Pickup'),
    ]

    order_id = models.CharField(max_length=30, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon = models.ForeignKey('coupons.Coupon', on_delete=models.SET_NULL, null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    razorpay_order_id = models.CharField(max_length=100, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True)
    shipping_address = models.JSONField()
    delivery_type = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='home')
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_delivery = models.DateField(null=True, blank=True)
    tracking_provider = models.CharField(max_length=50, blank=True)
    tracking_id = models.CharField(max_length=100, blank=True)
    tracking_url = models.URLField(max_length=500, blank=True)
    notes = models.TextField(blank=True)
    loyalty_points_earned = models.IntegerField(default=0)
    loyalty_points_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        old = None
        if not is_new:
            try:
                old = Order.objects.get(pk=self.pk)
            except Order.DoesNotExist:
                pass
        super().save(*args, **kwargs)
        if old and old.status != self.status:
            OrderStatusHistory.objects.create(
                order=self, status=self.status,
                note=f'Status changed from {old.status} to {self.status}',
            )
        if is_new:
            OrderStatusHistory.objects.create(
                order=self, status=self.status,
                note='Order created',
            )

    def __str__(self):
        return self.order_id


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'order status histories'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.order.order_id} → {self.status}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    variant = models.ForeignKey('products.ProductVariant', on_delete=models.SET_NULL, null=True, blank=True)
    product_snapshot = models.JSONField()
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.order.order_id} - {self.product_snapshot.get("name", "?")} x {self.quantity}'


class Refund(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processed', 'Processed'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    razorpay_refund_id = models.CharField(max_length=100, null=True, blank=True)
    # Staff-confirmed, not system-verified - there's no courier integration
    # behind this, just a person saying "yes, it's physically back." Approval
    # (the step that actually moves money) is blocked until this is true.
    item_received = models.BooleanField(default=False)
    item_received_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Refund {self.id} - {self.order.order_id}'
