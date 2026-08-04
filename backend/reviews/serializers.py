from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ('id', 'user', 'user_name', 'rating', 'text', 'images',
                  'is_verified_purchase', 'is_approved', 'created_at')
        read_only_fields = ('user', 'is_verified_purchase', 'is_approved')

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email or obj.user.phone or 'Anonymous'


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('rating', 'text', 'images')

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return value
