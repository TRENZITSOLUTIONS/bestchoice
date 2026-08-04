from django.db import transaction
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


def merge_session_cart(user, session_id):
    """Fold a guest's session cart into their user cart at sign-in.

    Without this, everything a visitor added before signing in silently
    disappeared the moment they authenticated.
    """
    if not session_id:
        return None

    guest_cart = Cart.objects.filter(session_id=session_id, user__isnull=True).first()
    if not guest_cart:
        return None

    user_cart, _ = Cart.objects.get_or_create(user=user)

    with transaction.atomic():
        for item in guest_cart.items.select_related('product', 'variant').all():
            existing = user_cart.items.filter(
                product=item.product, variant=item.variant
            ).first()

            if existing:
                # Combine, but never above what's actually in stock.
                available = item.variant.stock if item.variant else item.product.total_stock
                existing.quantity = min(existing.quantity + item.quantity, max(available, 1))
                existing.save(update_fields=['quantity'])
            else:
                item.cart = user_cart
                item.save(update_fields=['cart'])

        # Carry an applied coupon across only if the user's cart has none.
        if guest_cart.coupon_id and not user_cart.coupon_id:
            user_cart.coupon_id = guest_cart.coupon_id
            user_cart.save(update_fields=['coupon'])

        guest_cart.delete()

    return user_cart


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
        try:
            quantity = int(request.data.get('quantity', item.quantity))
        except (TypeError, ValueError):
            return Response({'error': 'Quantity must be a number'},
                            status=status.HTTP_400_BAD_REQUEST)

        if quantity < 1:
            item.delete()
            return Response({'message': 'Item removed'}, status=status.HTTP_204_NO_CONTENT)

        # Stock was only ever checked when the item was added, so quantity could
        # be raised past what's in stock afterwards.
        available = item.variant.stock if item.variant else item.product.total_stock
        if quantity > available:
            return Response({'error': f'Only {available} items available'},
                            status=status.HTTP_400_BAD_REQUEST)

        item.quantity = quantity
        item.save()
        return Response(CartItemSerializer(item).data)

    elif request.method == 'DELETE':
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
