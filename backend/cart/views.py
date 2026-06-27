from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer, CartItemCreateSerializer
from products.models import Product


def get_or_create_cart(request):
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
    else:
        session_id = request.session.session_key
        if not session_id:
            request.session.create()
            session_id = request.session.session_key
        cart, _ = Cart.objects.get_or_create(session_id=session_id)
    return cart


@api_view(['GET'])
def cart_detail(request):
    cart = get_or_create_cart(request)
    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(['POST'])
def cart_add_item(request):
    cart = get_or_create_cart(request)
    serializer = CartItemCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    product = serializer.validated_data['product']
    variant = serializer.validated_data.get('variant')
    quantity = serializer.validated_data.get('quantity', 1)

    price = variant.price_override if variant and variant.price_override else product.selling_price

    existing = CartItem.objects.filter(
        cart=cart, product=product, variant=variant
    ).first()

    if existing:
        existing.quantity += quantity
        existing.save()
        item = existing
    else:
        item = CartItem.objects.create(
            cart=cart, product=product, variant=variant,
            quantity=quantity, price=price,
        )

    return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
def cart_item_detail(request, item_id):
    cart = get_or_create_cart(request)
    try:
        item = CartItem.objects.get(id=item_id, cart=cart)
    except CartItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        quantity = request.data.get('quantity', item.quantity)
        if quantity < 1:
            item.delete()
            return Response({'message': 'Item removed'}, status=status.HTTP_204_NO_CONTENT)
        item.quantity = quantity
        item.save()
        return Response(CartItemSerializer(item).data)

    elif request.method == 'DELETE':
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
