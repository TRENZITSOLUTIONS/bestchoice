from rest_framework import serializers
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_slug = serializers.ReadOnlyField(source='product.slug')
    product_image = serializers.SerializerMethodField()
    product_price = serializers.ReadOnlyField(source='product.selling_price')
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem
        fields = ('id', 'product', 'product_name', 'product_slug',
                  'product_image', 'product_price', 'in_stock', 'created_at')
        read_only_fields = ('created_at',)

    def get_product_image(self, obj):
        img = obj.product.images.filter(is_primary=True).first()
        return (img.small or img.image).url if img else None

    def get_in_stock(self, obj):
        return obj.product.total_stock > 0
