from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'phone', 'first_name', 'last_name', 'loyalty_points')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    referral_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'phone', 'password', 'first_name', 'last_name', 'referral_code')

    def create(self, validated_data):
        referral_code = validated_data.pop('referral_code', '')
        user = User.objects.create_user(
            username=validated_data.get('email') or validated_data.get('phone'),
            email=validated_data.get('email', ''),
            phone=validated_data.get('phone', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
        )
        if referral_code:
            referrer = User.objects.filter(referral_code=referral_code).first()
            if referrer:
                user.referred_by = referrer
                user.save(update_fields=['referred_by'])
        return user
