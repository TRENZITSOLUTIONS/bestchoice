from rest_framework import serializers
from .models import DeliveryPincode


class DeliveryCheckSerializer(serializers.Serializer):
    pincode = serializers.CharField(max_length=6)
