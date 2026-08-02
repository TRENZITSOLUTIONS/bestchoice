from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Brand, Product
from .serializers import (
    CategorySerializer, BrandSerializer,
    ProductListSerializer, ProductDetailSerializer,
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
    filterset_fields = {
        'category__slug': ['exact'],
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
        return visible_to_customers(Product.objects.filter(
            is_active=True,
            category__slug=self.kwargs['category_slug'],
        ))


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_product(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    allowed = ('name', 'slug', 'mrp', 'selling_price', 'total_stock', 'is_active', 'weight_g',
               'short_description', 'description', 'category_id', 'brand_id', 'hide_if_out_of_stock')
    data = {k: v for k, v in request.data.items() if k in allowed}

    for attr, value in data.items():
        setattr(product, attr, value)
    product.save()
    return Response({'updated': list(data.keys()), 'name': product.name})
