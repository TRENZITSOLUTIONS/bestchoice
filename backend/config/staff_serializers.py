from rest_framework import serializers

from coupons.models import Coupon


class CouponWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            'code', 'discount_type', 'discount_value', 'min_cart_value',
            'max_discount', 'valid_from', 'valid_till', 'usage_limit',
            'per_user_limit', 'is_active', 'description',
        )

    def validate_code(self, value):
        return value.strip().upper()

    def validate_discount_value(self, value):
        if value <= 0:
            raise serializers.ValidationError('Discount must be greater than zero.')
        return value

    def validate(self, data):
        # On a PATCH, fall back to the stored value for anything not being changed.
        def field(name):
            if name in data:
                return data[name]
            return getattr(self.instance, name, None)

        valid_from, valid_till = field('valid_from'), field('valid_till')
        if valid_from and valid_till and valid_till <= valid_from:
            raise serializers.ValidationError(
                {'valid_till': 'Must be after valid_from.'}
            )

        if field('discount_type') == 'percentage' and (field('discount_value') or 0) > 100:
            raise serializers.ValidationError(
                {'discount_value': 'A percentage discount cannot exceed 100.'}
            )

        return data
