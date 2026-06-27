from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Coupon, CouponUsage
from .serializers import CouponApplySerializer
from cart.views import get_or_create_cart


@api_view(['POST'])
def apply_coupon(request):
    serializer = CouponApplySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    coupon = Coupon.objects.get(code=serializer.validated_data['code'])
    cart = get_or_create_cart(request)

    subtotal = sum(item.price * item.quantity for item in cart.items.all())
    if subtotal < coupon.min_cart_value:
        return Response({
            'error': True,
            'message': f'Minimum cart value ₹{coupon.min_cart_value} required',
            'code': 'MIN_CART',
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check per-user limit
    if request.user.is_authenticated:
        usage_count = CouponUsage.objects.filter(coupon=coupon, user=request.user).count()
        if usage_count >= coupon.per_user_limit:
            return Response({
                'error': True, 'message': 'Coupon already used', 'code': 'ALREADY_USED',
            }, status=status.HTTP_400_BAD_REQUEST)

    if coupon.discount_type == 'percentage':
        discount = subtotal * coupon.discount_value / 100
        if coupon.max_discount:
            discount = min(discount, coupon.max_discount)
    else:
        discount = coupon.discount_value

    # Mark usage
    coupon.used_count += 1
    coupon.save()
    if request.user.is_authenticated:
        CouponUsage.objects.create(coupon=coupon, user=request.user)

    total = subtotal - discount

    return Response({
        'success': True,
        'discount': str(discount),
        'discount_label': f'{coupon.discount_value}% off' if coupon.discount_type == 'percentage' else f'₹{coupon.discount_value} off',
        'total': str(total),
        'coupon': {'code': coupon.code, 'discount_percent': coupon.discount_value, 'max_discount': str(coupon.max_discount) if coupon.max_discount else None},
    })


@api_view(['DELETE'])
def remove_coupon(request):
    return Response({'success': True, 'message': 'Coupon removed'})
