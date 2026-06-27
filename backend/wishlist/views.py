from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import WishlistItem
from .serializers import WishlistItemSerializer
from products.models import Product


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def wishlist_list(request):
    if request.method == 'GET':
        items = WishlistItem.objects.filter(user=request.user)
        serializer = WishlistItemSerializer(items, many=True)
        return Response(serializer.data)

    # POST
    product_id = request.data.get('product')
    if not product_id:
        return Response({'error': 'Product ID required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
    if created:
        return Response(WishlistItemSerializer(item).data, status=status.HTTP_201_CREATED)
    return Response(WishlistItemSerializer(item).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def wishlist_remove(request, product_id):
    deleted, _ = WishlistItem.objects.filter(user=request.user, product_id=product_id).delete()
    if deleted:
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
