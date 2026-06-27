from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Brand, Product
from .serializers import (
    CategorySerializer, BrandSerializer,
    ProductListSerializer, ProductDetailSerializer,
)


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
        qs = super().get_queryset()
        color = self.request.query_params.get('color')
        size = self.request.query_params.get('size')
        discount = self.request.query_params.get('discount')

        if color:
            qs = qs.filter(variants__color__iexact=color, variants__is_active=True).distinct()
        if size:
            qs = qs.filter(variants__size__iexact=size, variants__is_active=True).distinct()
        if discount:
            qs = qs.extra(
                where=['((mrp - selling_price) * 100.0 / mrp) >= %s'],
                params=[float(discount)],
            )
        return qs


class ProductByCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            category__slug=self.kwargs['category_slug'],
        )
