from rest_framework import serializers
from .models import Category, Brand, Product, ProductImage, ProductVariant, ProductHighlight


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'image', 'parent', 'children', 'product_count')

    def get_children(self, obj):
        return CategorySerializer(obj.children.filter(is_active=True), many=True).data

    product_count = serializers.SerializerMethodField()

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'logo')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_primary', 'sort_order')


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ('id', 'color', 'size', 'sku', 'stock', 'price_override')


class ProductHighlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductHighlight
        fields = ('text',)


class ProductListSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    brand = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    primary_image = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    has_variants = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'auto_product_id', 'name', 'slug', 'short_description',
            'category', 'brand', 'primary_image', 'mrp', 'selling_price',
            'discount_percent', 'has_variants', 'in_stock',
            'average_rating', 'review_count',
        )

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first()
        if not img:
            img = obj.images.first()
        return img.image if img else None

    def get_discount_percent(self, obj):
        if obj.mrp > 0:
            return int(((obj.mrp - obj.selling_price) / obj.mrp) * 100)
        return 0

    def get_has_variants(self, obj):
        return obj.variants.exists()

    def get_in_stock(self, obj):
        return obj.total_stock > 0

    def get_average_rating(self, obj):
        ratings = [r.rating for r in obj.reviews.filter(is_approved=True)]
        return round(sum(ratings) / len(ratings), 1) if ratings else 0

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    highlights = ProductHighlightSerializer(many=True, read_only=True)
    category = serializers.SerializerMethodField()
    brand = BrandSerializer(read_only=True)
    available_colors = serializers.SerializerMethodField()
    available_sizes = serializers.SerializerMethodField()
    pricing = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'auto_product_id', 'name', 'slug', 'short_description',
            'description', 'category', 'brand', 'images', 'variants',
            'highlights', 'available_colors', 'available_sizes',
            'pricing', 'stock_status', 'gst_included', 'rating',
            'hide_if_out_of_stock', 'created_at',
        )

    def get_category(self, obj):
        def serialize_cat(cat):
            return {
                'id': cat.id, 'name': cat.name, 'slug': cat.slug,
                'parent': serialize_cat(cat.parent) if cat.parent else None,
            }
        return serialize_cat(obj.category) if obj.category else None

    def get_available_colors(self, obj):
        return list(set(
            v.color for v in obj.variants.filter(is_active=True) if v.color
        ))

    def get_available_sizes(self, obj):
        return list(set(
            v.size for v in obj.variants.filter(is_active=True) if v.size
        ))

    def get_pricing(self, obj):
        discount = 0
        if obj.mrp > 0:
            discount = int(((obj.mrp - obj.selling_price) / obj.mrp) * 100)
        return {
            'mrp': str(obj.mrp),
            'selling_price': str(obj.selling_price),
            'discount_percent': discount,
            'gst_included': obj.gst_included,
        }

    def get_stock_status(self, obj):
        stock = obj.total_stock
        if stock > 10:
            return {'badge': 'in_stock', 'label': 'In Stock'}
        elif stock > 0:
            return {'badge': 'low_stock', 'label': f'Only {stock} Left'}
        else:
            return {'badge': 'out_of_stock', 'label': 'Out of Stock'}

    def get_rating(self, obj):
        reviews = obj.reviews.filter(is_approved=True)
        ratings = [r.rating for r in reviews]
        avg = round(sum(ratings) / len(ratings), 1) if ratings else 0
        dist = {str(i): 0 for i in range(1, 6)}
        for r in ratings:
            dist[str(r)] += 1
        return {
            'average': avg,
            'count': len(ratings),
            'distribution': dist,
        }
