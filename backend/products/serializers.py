from django.db.models import Q
from django.utils.text import slugify
from rest_framework import serializers
from .models import Category, Brand, Product, ProductImage, ProductVariant, ProductHighlight


def unique_slug(model, base, instance=None):
    """Slugify `base`, disambiguating with a numeric suffix if it collides."""
    slug = slugify(base)[:100] or 'item'
    candidate = slug
    n = 2
    qs = model.objects.exclude(pk=instance.pk) if instance else model.objects.all()
    while qs.filter(slug=candidate).exists():
        candidate = f'{slug}-{n}'
        n += 1
    return candidate


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


class AdminCategorySerializer(serializers.ModelSerializer):
    """The staff catalogue view - unlike the storefront's CategorySerializer,
    this shows inactive rows too (so staff can find and reactivate them) and
    nests children regardless of their own active state."""
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            'id', 'name', 'slug', 'parent', 'image', 'is_active',
            'sort_order', 'children', 'product_count',
        )

    def get_children(self, obj):
        return AdminCategorySerializer(
            obj.children.order_by('sort_order', 'name'), many=True).data

    def get_product_count(self, obj):
        return Product.objects.filter(Q(category=obj) | Q(category__parent=obj)).count()


class AdminCategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('name', 'slug', 'parent', 'image', 'is_active', 'sort_order')
        extra_kwargs = {'slug': {'required': False}}

    def validate_parent(self, parent):
        if parent is None:
            return parent
        if self.instance and parent_id_in_ancestry(parent, self.instance.pk):
            raise serializers.ValidationError(
                'A category cannot be nested under itself or one of its own subcategories.')
        return parent

    def create(self, validated_data):
        if not validated_data.get('slug'):
            validated_data['slug'] = unique_slug(Category, validated_data['name'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'slug' in validated_data and not validated_data['slug']:
            validated_data['slug'] = unique_slug(Category, validated_data.get('name', instance.name), instance)
        return super().update(instance, validated_data)


def parent_id_in_ancestry(candidate_parent, instance_pk):
    """True if `instance_pk` appears anywhere up candidate_parent's own parent
    chain - i.e. setting it as parent would create a cycle. The category tree
    is shallow in practice, but nothing stops staff from chaining it deeper."""
    node = candidate_parent
    seen = set()
    while node is not None:
        if node.pk == instance_pk or node.pk in seen:
            return True
        seen.add(node.pk)
        node = node.parent
    return False


class AdminBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'logo', 'is_active')


class AdminBrandWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('name', 'slug', 'logo', 'is_active')
        extra_kwargs = {'slug': {'required': False}}

    def create(self, validated_data):
        if not validated_data.get('slug'):
            validated_data['slug'] = unique_slug(Brand, validated_data['name'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'slug' in validated_data and not validated_data['slug']:
            validated_data['slug'] = unique_slug(Brand, validated_data.get('name', instance.name), instance)
        return super().update(instance, validated_data)


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'thumb', 'small', 'medium', 'large', 'alt_text', 'is_primary', 'sort_order')


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            'id', 'variant_id', 'color', 'size', 'sku', 'stock', 'price_override',
            'fabric', 'fit', 'age_group', 'sleeve_type', 'occasion',
            'shade', 'volume', 'skin_type',
        )


class AdminProductVariantSerializer(serializers.ModelSerializer):
    """Create/edit a variant from the staff dashboard.

    `sku` is derived by ProductVariant.build_sku() and read-only here -
    letting staff type one by hand risks colliding with (or duplicating
    the shape of) the auto-generated ones.
    """

    class Meta:
        model = ProductVariant
        fields = (
            'id', 'variant_id', 'color', 'size', 'sku', 'stock', 'price_override',
            'fabric', 'fit', 'age_group', 'sleeve_type', 'occasion',
            'shade', 'volume', 'skin_type', 'is_active',
        )
        read_only_fields = ('variant_id', 'sku')

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError('Cannot be negative.')
        return value

    def validate_price_override(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError('Must be greater than zero.')
        return value

    def validate(self, attrs):
        # Two variants identical on every option axis would still get
        # distinct SKUs (the auto-generator disambiguates with a numeric
        # suffix), which just looks like a silent duplicate to staff.
        product = self.context['product']
        axes = ('color', 'size', 'shade', 'volume')
        candidate = {
            axis: attrs.get(axis, getattr(self.instance, axis, '') if self.instance else '')
            for axis in axes
        }
        others = product.variants.exclude(pk=self.instance.pk if self.instance else None)
        for existing in others:
            if all(getattr(existing, axis) == candidate[axis] for axis in axes):
                raise serializers.ValidationError('A variant with these exact options already exists.')
        return attrs


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
            'id', 'product_id', 'sku', 'name', 'slug', 'short_description',
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
            'id', 'product_id', 'sku', 'name', 'slug', 'short_description',
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
