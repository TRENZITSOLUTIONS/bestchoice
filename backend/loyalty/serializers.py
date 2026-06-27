from rest_framework import serializers
from .models import LoyaltyTransaction


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyTransaction
        fields = ('points', 'type', 'description', 'created_at')
