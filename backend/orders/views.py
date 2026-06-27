from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Order, OrderItem
from .serializers import (
    OrderListSerializer, OrderDetailSerializer,
    CheckoutSerializer, RefundSerializer,
)
from cart.models import Cart
from products.models import ProductVariant
from loyalty.models import LoyaltyTransaction
from django.utils import timezone
from datetime import timedelta
import uuid


def generate_order_id():
    date_part = timezone.now().strftime('%Y%m%d')
    last = Order.objects.filter(
        order_id__startswith=f'BC-ORD-{date_part}'
    ).order_by('order_id').last()
    if last:
        num = int(last.order_id.split('-')[-1]) + 1
    else:
        num = 1
    return f'BC-ORD-{date_part}-{num:04d}'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request):
    serializer = CheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        cart = Cart.objects.get(user=request.user)
    except Cart.DoesNotExist:
        return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    if not cart.items.exists():
        return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    subtotal = sum(item.price * item.quantity for item in cart.items.all())

    order = Order.objects.create(
        order_id=generate_order_id(),
        user=request.user,
        subtotal=subtotal,
        discount=0,
        total=subtotal,
        status='pending',
        payment_status='pending',
        shipping_address=serializer.validated_data['shipping_address'],
        delivery_type=serializer.validated_data['delivery_type'],
        notes=serializer.validated_data.get('notes', ''),
        estimated_delivery=timezone.now().date() + timedelta(days=3),
    )

    for cart_item in cart.items.all():
        variant = cart_item.variant
        if variant:
            if variant.stock < cart_item.quantity:
                order.status = 'cancelled'
                order.save()
                return Response(
                    {'error': f'Insufficient stock for {variant.sku}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            variant.stock -= cart_item.quantity
            variant.save()

        OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            variant=variant,
            product_snapshot={
                'name': cart_item.product.name,
                'sku': variant.sku if variant else cart_item.product.auto_product_id,
                'price': str(cart_item.price),
            },
            quantity=cart_item.quantity,
            price=cart_item.price,
        )

    # Earn loyalty points
    points_earned = int(subtotal / 100) * 5
    order.loyalty_points_earned = points_earned
    order.save()

    LoyaltyTransaction.objects.create(
        user=request.user,
        points=points_earned,
        type='earned',
        order=order,
        description=f'Order {order.order_id}',
    )
    request.user.loyalty_points += points_earned
    request.user.save()

    cart.items.all().delete()

    return Response({
        'order_id': order.order_id,
        'total': str(order.total),
        'razorpay_order_id': order.razorpay_order_id,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_list(request):
    orders = Order.objects.filter(user=request.user)
    serializer = OrderListSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = OrderDetailSerializer(order)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.status in ['shipped', 'delivered', 'cancelled']:
        return Response({'error': 'Order cannot be cancelled'}, status=status.HTTP_400_BAD_REQUEST)

    for item in order.items.all():
        if item.variant:
            item.variant.stock += item.quantity
            item.variant.save()

    order.status = 'cancelled'
    order.save()

    # Refund loyalty points
    if order.loyalty_points_earned > 0:
        LoyaltyTransaction.objects.create(
            user=request.user,
            points=-order.loyalty_points_earned,
            type='refund',
            order=order,
            description=f'Cancelled {order.order_id}',
        )
        request.user.loyalty_points = max(0, request.user.loyalty_points - order.loyalty_points_earned)
        request.user.save()

    return Response({'status': 'cancelled', 'message': 'Order cancelled successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_refund(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.status != 'delivered':
        return Response({'error': 'Only delivered orders can be refunded'}, status=status.HTTP_400_BAD_REQUEST)

    refund = Refund.objects.create(
        order=order,
        amount=order.total,
        reason=request.data.get('reason', ''),
        status='requested',
    )
    return Response(RefundSerializer(refund).data, status=status.HTTP_201_CREATED)
