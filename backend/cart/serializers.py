from rest_framework import serializers
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_slug = serializers.ReadOnlyField(source='product.slug')
    product_image = serializers.SerializerMethodField()
    variant_label = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_name', 'product_slug', 'product_image',
                  'variant', 'variant_label', 'quantity', 'price', 'total_price')
        read_only_fields = ('price',)

    def get_product_image(self, obj):
        img = obj.product.images.filter(is_primary=True).first()
        return (img.small or img.image).url if img else None

    def get_variant_label(self, obj):
        if obj.variant:
            parts = [p for p in [obj.variant.color, obj.variant.size] if p]
            return ' / '.join(parts)
        return ''

    total_price = serializers.SerializerMethodField()

    def get_total_price(self, obj):
        return str(obj.price * obj.quantity)


class CartItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ('product', 'variant', 'quantity')

    def validate(self, data):
        product = data['product']
        variant = data.get('variant')
        qty = data.get('quantity', 1)

        if variant and variant.product != product:
            raise serializers.ValidationError('Variant does not belong to this product')

        available = variant.stock if variant else product.total_stock
        if available < qty:
            raise serializers.ValidationError(f'Only {available} items available')
        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    discount = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    coupon = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'items', 'item_count', 'subtotal', 'coupon', 'discount', 'total')

    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_subtotal(self, obj):
        return str(obj.get_subtotal())

    def get_discount(self, obj):
        return str(obj.get_coupon_discount())

    def get_total(self, obj):
        subtotal = obj.get_subtotal()
        return str(subtotal - obj.get_coupon_discount(subtotal))

    def get_coupon(self, obj):
        """Null unless a coupon is applied *and* still qualifies for this cart."""
        if not obj.coupon_id or obj.get_coupon_discount() <= 0:
            return None

        from coupons.utils import serialize_coupon

        return serialize_coupon(obj.coupon)
