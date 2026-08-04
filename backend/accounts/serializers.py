from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # is_staff is read-only and drives whether the frontend shows the staff
        # dashboard. The API still enforces it server-side on every /admin/ route.
        fields = ('id', 'email', 'phone', 'first_name', 'last_name',
                  'loyalty_points', 'is_staff')
        read_only_fields = ('is_staff', 'loyalty_points')
