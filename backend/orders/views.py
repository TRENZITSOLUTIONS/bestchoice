import hmac
import json
import razorpay
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta

from .models import Order, OrderItem, Refund, Refund, OrderStatusHistory
from .serializers import (
    OrderListSerializer, OrderDetailSerializer,
    CheckoutSerializer, RefundSerializer, OrderTrackingSerializer,
)
from cart.models import Cart
from coupons.utils import record_usage, release_usage
from loyalty.utils import (
    earn_points, consume_points, reverse_earned_points, restore_used_points,
    points_for_order_subtotal, rupee_value_of_points, max_redeemable_points,
)
from delivery.utils import get_delivery_quote
from notifications.utils import send_order_confirmation


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
    total_weight_g = sum(
        (item.product.weight_g if item.product else 500) * item.quantity
        for item in cart.items.all()
    )
    delivery_type = serializer.validated_data.get('delivery_type', 'home')
    shipping_address = serializer.validated_data.get('shipping_address', {})
    delivery_quote = get_delivery_quote(
        pincode=shipping_address.get('pincode', ''),
        state=shipping_address.get('state', ''),
        total_weight_g=total_weight_g,
        order_total=subtotal,
    )
    if delivery_type == 'home' and not delivery_quote['available']:
        return Response(
            {'error': 'Delivery is not available for this address'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    delivery_charge = delivery_quote['charge']

    # Recompute the coupon discount here rather than trusting whatever the cart
    # showed - the cart can change between applying a code and paying.
    coupon = cart.coupon
    coupon_discount = cart.get_coupon_discount(subtotal) if coupon else Decimal(0)
    if coupon and coupon_discount <= 0:
        coupon = None

    points_used = serializer.validated_data.get('loyalty_points_used', 0)
    points_discount = Decimal(0)
    if points_used > 0:
        if points_used > request.user.loyalty_points:
            return Response({'error': 'Insufficient loyalty points'}, status=status.HTTP_400_BAD_REQUEST)
        if points_used > max_redeemable_points(subtotal):
            return Response(
                {'error': 'Points used exceed the maximum redeemable for this order'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        points_discount = rupee_value_of_points(points_used)

    # Coupon and points stack, but together they can never exceed the goods total.
    discount = coupon_discount + points_discount
    if discount > subtotal:
        discount = subtotal
        points_discount = max(Decimal(0), subtotal - coupon_discount)

    total_before_round = subtotal - discount + delivery_charge
    total = int(total_before_round * 100)  # Convert to paise for Razorpay

    # Check every line before deducting anything, so a shortage on the last item
    # can't leave earlier items already decremented.
    cart_items = list(cart.items.select_related('product', 'variant').all())
    for cart_item in cart_items:
        variant = cart_item.variant
        available = variant.stock if variant else cart_item.product.total_stock
        if available < cart_item.quantity:
            label = variant.sku if variant else cart_item.product.name
            return Response(
                {'error': f'Insufficient stock for {label}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Reserve the Razorpay order before touching the database: if the gateway is
    # down we return without having deducted stock or consumed the coupon.
    order_id = generate_order_id()
    try:
        razorpay_order = client.order.create({
            'amount': total,
            'currency': 'INR',
            'receipt': order_id,
            'payment_capture': 1,
        })
    except Exception:
        return Response(
            {'error': 'Payment gateway error. Please try again.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    with transaction.atomic():
        order = Order.objects.create(
            order_id=order_id,
            razorpay_order_id=razorpay_order['id'],
            user=request.user,
            subtotal=subtotal,
            coupon=coupon,
            discount=discount,
            delivery_charge=delivery_charge,
            total=total_before_round,
            status='pending',
            payment_status='pending',
            shipping_address=serializer.validated_data['shipping_address'],
            delivery_type=delivery_type,
            notes=serializer.validated_data.get('notes', ''),
            estimated_delivery=timezone.now().date() + timedelta(days=3),
            loyalty_points_used=points_used,
        )

        for cart_item in cart_items:
            variant = cart_item.variant
            if variant:
                variant.stock -= cart_item.quantity
                variant.save()

            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                variant=variant,
                product_snapshot={
                    'name': cart_item.product.name,
                    'sku': variant.sku if variant else cart_item.product.sku,
                    'price': str(cart_item.price),
                },
                quantity=cart_item.quantity,
                price=cart_item.price,
            )

        if coupon:
            record_usage(coupon, request.user, order)

        cart.items.all().delete()
        if cart.coupon_id:
            cart.coupon = None
            cart.save(update_fields=['coupon'])

    return Response({
        'order_id': order.order_id,
        'subtotal': str(subtotal),
        'delivery_charge': str(delivery_charge),
        'discount': str(discount),
        'coupon_discount': str(coupon_discount),
        'loyalty_discount': str(points_discount),
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

    if order.loyalty_points_used > 0:
        consume_points(order.user, order.loyalty_points_used, order=order,
                       description=f'Redeemed for order {order.order_id}')

    points_earned = points_for_order_subtotal(order.subtotal)
    order.loyalty_points_earned = points_earned
    order.save()
    earn_points(order.user, points_earned, order=order, description=f'Order {order.order_id}')

    send_order_confirmation(order)

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


def _restock_order_items(order):
    """Put an order's items back into sellable stock - variant.stock for a
    variant, product.total_stock for a product that has none (this used to
    only handle the variant case, silently never restocking a plain
    single-SKU product). No-ops for a line whose product/variant has since
    been deleted - there's nothing left to restock."""
    for item in order.items.select_related('product', 'variant').all():
        if item.variant:
            item.variant.stock += item.quantity
            item.variant.save(update_fields=['stock'])
        elif item.product:
            item.product.total_stock += item.quantity
            item.product.save(update_fields=['total_stock'])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.status in ['shipped', 'delivered', 'cancelled']:
        return Response({'error': 'Order cannot be cancelled'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        _restock_order_items(order)

        # Hand the coupon use back - the customer never got the goods.
        if order.coupon_id:
            release_usage(order.coupon, order.user, order)

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
        reverse_earned_points(request.user, order, description=f'Cancelled {order.order_id}')

    if order.loyalty_points_used > 0 and order.payment_status == 'paid':
        restore_used_points(request.user, order.loyalty_points_used, order=order,
                            description=f'Points refunded for cancelled {order.order_id}')

    return Response({'status': 'cancelled', 'message': 'Order cancelled successfully'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_update_order_status(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status not in dict(Order.STATUS_CHOICES):
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    order.status = new_status
    order.save()
    return Response({'status': order.status})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_tracking(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = OrderTrackingSerializer(order)
    return Response(serializer.data)


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
@permission_classes([IsAdminUser])
def admin_mark_refund_received(request, refund_id):
    """Staff confirming the returned item is physically back - there's no
    courier integration behind this, just a person saying so. Restocks the
    order's items immediately (same mechanism cancel_order uses) and is the
    only thing that unlocks approval below."""
    try:
        refund = Refund.objects.select_related('order').get(pk=refund_id)
    except Refund.DoesNotExist:
        return Response({'error': 'Refund not found'}, status=status.HTTP_404_NOT_FOUND)

    if not refund.item_received:
        with transaction.atomic():
            _restock_order_items(refund.order)
            refund.item_received = True
            refund.item_received_at = timezone.now()
            refund.save(update_fields=['item_received', 'item_received_at'])

    return Response(RefundSerializer(refund).data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_update_refund_status(request, refund_id):
    try:
        refund = Refund.objects.select_related('order', 'order__user').get(pk=refund_id)
    except Refund.DoesNotExist:
        return Response({'error': 'Refund not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status not in dict(Refund.STATUS_CHOICES):
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    already_finalized = refund.status in ('approved', 'processed')
    warning = None

    if new_status in ('approved', 'processed') and not already_finalized:
        # The one hard gate: no money moves until the item is confirmed back.
        if not refund.item_received:
            return Response(
                {'error': 'Mark the item as received before approving this refund.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = refund.order

        if order.payment_status == 'paid' and order.razorpay_payment_id:
            try:
                result = client.payment.refund(order.razorpay_payment_id, {
                    'amount': int(refund.amount * 100),
                })
                refund.razorpay_refund_id = result.get('id', '')
                order.payment_status = 'refunded'
                order.save(update_fields=['payment_status'])
            except Exception:
                # Money didn't actually move - the order must not claim
                # otherwise. Surfaced to staff instead of swallowed, since
                # this used to mark payment_status='refunded' unconditionally
                # even when this call failed.
                warning = (
                    'Razorpay refund failed - process this one manually via the '
                    'Razorpay dashboard. The order still shows as paid.'
                )

        # Give back what this order used - same reversal cancel_order already
        # does, just triggered by approval here instead of cancellation.
        if order.coupon_id:
            release_usage(order.coupon, order.user, order)
        if order.loyalty_points_used > 0:
            restore_used_points(order.user, order.loyalty_points_used, order=order,
                                description=f'Points refunded for {order.order_id}')
        # Rewards program excludes refunded orders - claw back whatever points remain
        if order.loyalty_points_earned > 0:
            reverse_earned_points(order.user, order, description=f'Refunded {order.order_id}')

    refund.status = new_status
    refund.save()
    response_data = RefundSerializer(refund).data
    if warning:
        response_data['warning'] = warning
    return Response(response_data)


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

    if order.loyalty_points_used > 0:
        consume_points(order.user, order.loyalty_points_used, order=order,
                       description=f'Redeemed for order {order.order_id}')

    points_earned = points_for_order_subtotal(order.subtotal)
    order.loyalty_points_earned = points_earned
    order.save()
    earn_points(order.user, points_earned, order=order, description=f'Order {order.order_id}')

    send_order_confirmation(order)

    return Response({'status': 'ok'})
