from rest_framework import serializers
from .models import Coupon


class CouponApplySerializer(serializers.Serializer):
    code = serializers.CharField()

    def validate_code(self, value):
        try:
            coupon = Coupon.objects.get(code=value, is_active=True)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError('Invalid coupon code')

        from django.utils import timezone
        now = timezone.now()
        if now < coupon.valid_from or now > coupon.valid_till:
            raise serializers.ValidationError('Coupon expired')

        if coupon.usage_limit > 0 and coupon.used_count >= coupon.usage_limit:
            raise serializers.ValidationError('Coupon usage limit reached')

        return value
