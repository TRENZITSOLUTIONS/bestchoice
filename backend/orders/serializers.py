from rest_framework import serializers
from .models import Order, OrderItem, Refund, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = ('id', 'amount', 'reason', 'status', 'created_at')


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'order_id', 'total', 'status', 'payment_status',
            'delivery_type', 'item_count', 'created_at',
        )

    def get_item_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    refunds = RefundSerializer(many=True, read_only=True)
    tracking = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'order_id', 'status', 'payment_status', 'items',
            'subtotal', 'discount', 'total', 'delivery_charge',
            'shipping_address', 'delivery_type', 'estimated_delivery',
            'tracking', 'refunds', 'notes', 'created_at',
        )

    def get_tracking(self, obj):
        if obj.tracking_id:
            return {
                'provider': obj.tracking_provider,
                'tracking_id': obj.tracking_id,
                'url': obj.tracking_url,
            }
        return None


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ('status', 'note', 'created_at')


class OrderTrackingSerializer(serializers.ModelSerializer):
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    estimated_delivery = serializers.DateField(format='%d %b %Y', allow_null=True)

    class Meta:
        model = Order
        fields = (
            'order_id', 'status', 'payment_status',
            'estimated_delivery', 'tracking_provider',
            'tracking_id', 'tracking_url', 'status_history',
        )


class CheckoutSerializer(serializers.Serializer):
    shipping_address = serializers.JSONField()
    delivery_type = serializers.ChoiceField(choices=['home', 'store_pickup'])
    notes = serializers.CharField(required=False, allow_blank=True)
    loyalty_points_used = serializers.IntegerField(min_value=0, required=False, default=0)
