from django.contrib import admin
from .models import Category, Brand, Product, ProductImage, ProductVariant, ProductHighlight, RelatedProduct


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 2


class ProductHighlightInline(admin.TabularInline):
    model = ProductHighlight
    extra = 3


class RelatedProductInline(admin.TabularInline):
    model = RelatedProduct
    fk_name = 'product'
    extra = 2


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'is_active', 'sort_order')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('auto_product_id', 'name', 'category', 'selling_price', 'mrp', 'total_stock', 'is_active')
    list_filter = ('is_active', 'category', 'brand')
    search_fields = ('name', 'auto_product_id')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductVariantInline, ProductHighlightInline, RelatedProductInline]
    readonly_fields = ('auto_product_id', 'total_stock')
