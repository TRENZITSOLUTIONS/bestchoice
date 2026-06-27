import hmac
import json
import razorpay
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta

from .models import Order, OrderItem, Refund, Refund
from .serializers import (
    OrderListSerializer, OrderDetailSerializer,
    CheckoutSerializer, RefundSerializer,
)
from cart.models import Cart
from loyalty.models import LoyaltyTransaction


client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


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
    total = int(subtotal * 100)  # Convert to paise for Razorpay

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

    # Create Razorpay order
    try:
        razorpay_order = client.order.create({
            'amount': total,
            'currency': 'INR',
            'receipt': order.order_id,
            'payment_capture': 1,
        })
        order.razorpay_order_id = razorpay_order['id']
        order.save()
    except Exception:
        order.status = 'cancelled'
        order.save()
        return Response(
            {'error': 'Payment gateway error. Please try again.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    cart.items.all().delete()

    return Response({
        'order_id': order.order_id,
        'total': str(order.total),
        'razorpay_order_id': order.razorpay_order_id,
        'razorpay_key_id': settings.RAZORPAY_KEY_ID,
        'amount_in_paise': total,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    data = request.data
    params_dict = {
        'razorpay_order_id': data['razorpay_order_id'],
        'razorpay_payment_id': data['razorpay_payment_id'],
        'razorpay_signature': data['razorpay_signature'],
    }

    try:
        client.utility.verify_payment_signature(params_dict)
    except razorpay.errors.SignatureVerificationError:
        return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(razorpay_order_id=data['razorpay_order_id'])
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    order.payment_status = 'paid'
    order.razorpay_payment_id = data['razorpay_payment_id']
    order.status = 'confirmed'
    order.save()

    # Earn loyalty points
    points_earned = int(order.subtotal / 100) * 5
    order.loyalty_points_earned = points_earned
    order.save()

    LoyaltyTransaction.objects.create(
        user=order.user,
        points=points_earned,
        type='earned',
        order=order,
        description=f'Order {order.order_id}',
    )
    order.user.loyalty_points += points_earned
    order.user.save()

    return Response({
        'success': True,
        'order_id': order.order_id,
        'status': order.status,
    })


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

    # Initiate Razorpay refund if paid
    if order.payment_status == 'paid' and order.razorpay_payment_id:
        try:
            client.payment.refund(order.razorpay_payment_id, {
                'amount': int(order.total * 100),
            })
            order.payment_status = 'refunded'
            order.save()
        except Exception:
            pass  # Refund will be processed manually

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


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def payment_webhook(request):
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    if not webhook_secret:
        return Response({'error': 'Webhook not configured'}, status=status.HTTP_501_NOT_IMPLEMENTED)

    received_sig = request.headers.get('X-Razorpay-Signature', '')
    body = request.body

    try:
        client.utility.verify_webhook_signature(body, received_sig, webhook_secret)
    except razorpay.errors.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

    event = json.loads(body)
    if event.get('event') != 'payment.captured':
        return Response({'status': 'ignored'})

    payload = event.get('payload', {}).get('payment', {}).get('entity', {})
    razorpay_order_id = payload.get('order_id')
    razorpay_payment_id = payload.get('id')

    if not razorpay_order_id:
        return Response({'error': 'Missing order_id'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(razorpay_order_id=razorpay_order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.payment_status == 'paid':
        return Response({'status': 'already_processed'})

    order.payment_status = 'paid'
    order.razorpay_payment_id = razorpay_payment_id
    order.status = 'confirmed'
    order.save()

    points_earned = int(order.subtotal / 100) * 5
    order.loyalty_points_earned = points_earned
    order.save()

    LoyaltyTransaction.objects.create(
        user=order.user,
        points=points_earned,
        type='earned',
        order=order,
        description=f'Order {order.order_id}',
    )
    order.user.loyalty_points += points_earned
    order.user.save()

    return Response({'status': 'ok'})
