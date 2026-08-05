from django.db.models import Q
from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Brand, Product, ProductImage, ProductVariant
from .serializers import (
    CategorySerializer, BrandSerializer,
    ProductListSerializer, ProductDetailSerializer, AdminProductWriteSerializer,
    ProductImageSerializer, AdminProductVariantSerializer,
)


def visible_to_customers(queryset):
    """Hide zero-stock products when the admin has opted in via hide_if_out_of_stock."""
    return queryset.exclude(hide_if_out_of_stock=True, total_stock__lte=0)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True, parent=None)
    serializer_class = CategorySerializer


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    search_fields = ('name',)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # category is handled in get_queryset instead of here: an exact match on
    # category__slug returns nothing for a top-level slug like "mens-wear",
    # because products are filed under subcategories (shirts, t-shirts, ...).
    filterset_fields = {
        'brand__slug': ['exact'],
        'selling_price': ['gte', 'lte'],
        'mrp': ['gte', 'lte'],
    }
    search_fields = ('name', 'auto_product_id', 'category__name', 'brand__name')
    ordering_fields = ('created_at', 'selling_price', 'name')
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def get_queryset(self):
        qs = visible_to_customers(super().get_queryset())
        params = self.request.query_params

        # Match the category itself or anything filed beneath it, so the main
        # nav's top-level slugs work as well as a specific subcategory. Accepts
        # either `category` or the older `category__slug` spelling.
        category = params.get('category') or params.get('category__slug')
        if category:
            qs = qs.filter(
                Q(category__slug=category) | Q(category__parent__slug=category)
            )

        color = params.get('color')
        size = params.get('size')
        discount = params.get('discount')
        fabric = params.get('fabric')
        fit = params.get('fit')
        sleeve_type = params.get('sleeve_type')
        occasion = params.get('occasion')
        shade = params.get('shade')
        skin_type = params.get('skin_type')
        compatible_device = params.get('compatible_device')
        availability = params.get('availability')

        variant_filters = {}
        if color:
            variant_filters['variants__color__iexact'] = color
        if size:
            variant_filters['variants__size__iexact'] = size
        if fabric:
            variant_filters['variants__fabric__iexact'] = fabric
        if fit:
            variant_filters['variants__fit__iexact'] = fit
        if sleeve_type:
            variant_filters['variants__sleeve_type__iexact'] = sleeve_type
        if occasion:
            variant_filters['variants__occasion__iexact'] = occasion
        if shade:
            variant_filters['variants__shade__iexact'] = shade
        if skin_type:
            variant_filters['variants__skin_type__iexact'] = skin_type
        if variant_filters:
            qs = qs.filter(variants__is_active=True, **variant_filters).distinct()

        if discount:
            qs = qs.extra(
                where=['((mrp - selling_price) * 100.0 / mrp) >= %s'],
                params=[float(discount)],
            )
        if compatible_device:
            qs = qs.filter(compatible_devices__icontains=compatible_device)
        if availability == 'in_stock':
            qs = qs.filter(total_stock__gt=0)
        elif availability == 'out_of_stock':
            qs = qs.filter(total_stock__lte=0)

        return qs


class ProductByCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductListSerializer

    def get_queryset(self):
        slug = self.kwargs['category_slug']
        return visible_to_customers(Product.objects.filter(is_active=True).filter(
            Q(category__slug=slug) | Q(category__parent__slug=slug)
        ))


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_product(request):
    serializer = AdminProductWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    product = serializer.save()
    return Response(ProductListSerializer(product).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminUser])
def admin_update_product(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AdminProductWriteSerializer(
        product, data=request.data, partial=(request.method == 'PATCH'))
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({'updated': list(serializer.validated_data.keys()), 'name': product.name})


def _get_product_or_404(pk):
    try:
        return Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return None


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_product_images(request, product_id):
    product = _get_product_or_404(product_id)
    if not product:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ProductImageSerializer(product.images.all(), many=True).data)

    serializer = ProductImageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    image = serializer.save(product=product)
    # The first photo on a product becomes its primary automatically -
    # otherwise a freshly-created product would show no image anywhere
    # until staff remembered to flag one.
    if not product.images.exclude(pk=image.pk).exists():
        image.is_primary = True
        image.save(update_fields=['is_primary'])
    return Response(ProductImageSerializer(image).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_product_image_detail(request, product_id, image_id):
    try:
        image = ProductImage.objects.get(pk=image_id, product_id=product_id)
    except ProductImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        was_primary = image.is_primary
        image.delete()
        if was_primary:
            # Hand primary status to whatever's now first, so the product
            # never silently ends up with photos but no primary one.
            successor = ProductImage.objects.filter(product_id=product_id).order_by('sort_order').first()
            if successor:
                successor.is_primary = True
                successor.save(update_fields=['is_primary'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = ProductImageSerializer(image, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    if serializer.validated_data.get('is_primary'):
        # Only one primary image per product.
        ProductImage.objects.filter(product_id=product_id).exclude(pk=image.pk).update(is_primary=False)
    return Response(ProductImageSerializer(image).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_product_variants(request, product_id):
    product = _get_product_or_404(product_id)
    if not product:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(AdminProductVariantSerializer(product.variants.all(), many=True).data)

    serializer = AdminProductVariantSerializer(data=request.data, context={'product': product})
    serializer.is_valid(raise_exception=True)
    variant = serializer.save(product=product)
    return Response(AdminProductVariantSerializer(variant).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_product_variant_detail(request, product_id, variant_id):
    try:
        variant = ProductVariant.objects.get(pk=variant_id, product_id=product_id)
    except ProductVariant.DoesNotExist:
        return Response({'error': 'Variant not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        variant.delete()  # also resyncs the product's total_stock
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = AdminProductVariantSerializer(
        variant, data=request.data, partial=True, context={'product': variant.product})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(AdminProductVariantSerializer(variant).data)
