from rest_framework import serializers
from .models import Order, OrderItem, Refund, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = ('id', 'amount', 'reason', 'status', 'item_received', 'created_at')


class StaffRefundSerializer(RefundSerializer):
    """Refunds as staff need them - with the order they belong to, plus the
    back-office detail (when the item was confirmed received, the actual
    Razorpay refund id) a customer viewing their own refund doesn't need.
    """
    order_id = serializers.CharField(source='order.order_id', read_only=True)

    class Meta(RefundSerializer.Meta):
        fields = RefundSerializer.Meta.fields + ('order_id', 'item_received_at', 'razorpay_refund_id')


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


class StaffOrderDetailSerializer(OrderDetailSerializer):
    """Same as the customer-facing detail view, plus who placed it - a
    customer viewing their own order already knows that; staff triaging
    someone else's order need it front and centre."""
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    customer_phone = serializers.CharField(source='user.phone', read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta(OrderDetailSerializer.Meta):
        fields = OrderDetailSerializer.Meta.fields + (
            'customer_name', 'customer_email', 'customer_phone', 'status_history',
        )

    def get_customer_name(self, obj):
        full_name = f'{obj.user.first_name} {obj.user.last_name}'.strip()
        return full_name or obj.user.email or obj.user.phone or ''


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
