from django.db.models import Q
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
        # Include products filed under child categories. Products live in
        # subcategories, so counting only direct children showed "(0)" against
        # every top-level department in the filter sidebar.
        return Product.objects.filter(is_active=True).filter(
            Q(category=obj) | Q(category__parent=obj)
        ).count()


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'logo')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'thumb', 'small', 'medium', 'large', 'alt_text', 'is_primary', 'sort_order')


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            'id', 'color', 'size', 'sku', 'stock', 'price_override',
            'fabric', 'fit', 'age_group', 'sleeve_type', 'occasion',
            'shade', 'volume', 'skin_type',
        )


class ProductHighlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductHighlight
        fields = ('text',)


class ProductListSerializer(serializers.ModelSerializer):
    # Human names, because these are rendered straight onto product cards -
    # they used to emit slugs, so shoppers saw "tempered-glass" and
    # "bestchoice-house". The slugs are still exposed separately for links
    # and filtering.
    category = serializers.SlugRelatedField(slug_field='name', read_only=True)
    brand = serializers.SlugRelatedField(slug_field='name', read_only=True)
    category_slug = serializers.SlugRelatedField(
        source='category', slug_field='slug', read_only=True)
    brand_slug = serializers.SlugRelatedField(
        source='brand', slug_field='slug', read_only=True)
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
            'category', 'category_slug', 'brand', 'brand_slug',
            'primary_image', 'mrp', 'selling_price',
            'discount_percent', 'has_variants', 'in_stock',
            'average_rating', 'review_count',
        )

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first()
        if not img:
            img = obj.images.first()
        if not img:
            return None
        return (img.small or img.image).url

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


class AdminProductWriteSerializer(serializers.ModelSerializer):
    """Create/edit a product from the staff dashboard.

    Deliberately scoped to what a staff member fills in by hand - images and
    variants stay in Django Admin, where the inline formsets for them
    already live. `category`/`brand` accept a plain id, matching every
    other FK the staff API takes.
    """

    class Meta:
        model = Product
        fields = (
            'name', 'category', 'brand', 'mrp', 'selling_price', 'total_stock',
            'is_active', 'hide_if_out_of_stock', 'weight_g',
            'short_description', 'description',
        )
        # DRF infers `required` from the model field's null/blank, which for a
        # nullable-but-mandatory FK like category isn't what we want here, and
        # it never pulls a model field's `default` through onto the generated
        # serializer field - so a create request that just omits `is_active`
        # would leave it out of validated_data instead of defaulting to True.
        # Both are made explicit rather than relying on that inference.
        extra_kwargs = {
            'category': {'required': True, 'allow_null': False},
            'is_active': {'default': True},
            'hide_if_out_of_stock': {'default': False},
            'total_stock': {'default': 0},
            'weight_g': {'default': 500},
        }

    def validate_mrp(self, value):
        if value <= 0:
            raise serializers.ValidationError('Must be greater than zero.')
        return value

    def validate_selling_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Must be greater than zero.')
        return value

    def validate_total_stock(self, value):
        if value < 0:
            raise serializers.ValidationError('Cannot be negative.')
        return value

    def validate(self, attrs):
        mrp = attrs.get('mrp', getattr(self.instance, 'mrp', None))
        selling_price = attrs.get('selling_price', getattr(self.instance, 'selling_price', None))
        if mrp is not None and selling_price is not None and selling_price > mrp:
            raise serializers.ValidationError(
                {'selling_price': 'Cannot exceed MRP.'})
        return attrs


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
    related = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'auto_product_id', 'name', 'slug', 'short_description',
            'description', 'category', 'brand', 'images', 'variants',
            'highlights', 'available_colors', 'available_sizes',
            'pricing', 'stock_status', 'gst_included', 'rating',
            'related', 'hide_if_out_of_stock', 'created_at',
            'expiry_date', 'batch_number', 'ingredients', 'usage_instructions',
            'care_instructions', 'compatible_devices', 'warranty',
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

    def get_related(self, obj):
        from .models import RelatedProduct
        curated = RelatedProduct.objects.filter(
            product=obj, relation_type__in=['similar', 'recommended']
        ).select_related('related_product')
        curated_ids = set()
        results = {'similar': [], 'recommended': []}
        for r in curated:
            curated_ids.add(r.related_product_id)
            serializer = RelatedProductSerializer(r.related_product)
            results[r.relation_type].append(serializer.data)
        same_category = Product.objects.filter(
            is_active=True, category=obj.category
        ).exclude(id=obj.id).exclude(id__in=curated_ids)[:8]
        serialized = RelatedProductSerializer(same_category, many=True).data
        results['similar'].extend(serialized)
        return results


class RelatedProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'selling_price', 'mrp', 'primary_image', 'discount_percent')

    primary_image = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first()
        if not img:
            img = obj.images.first()
        if not img:
            return None
        return (img.small or img.image).url

    def get_discount_percent(self, obj):
        if obj.mrp > 0:
            return int(((obj.mrp - obj.selling_price) / obj.mrp) * 100)
        return 0
