from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from cart.serializers import CartSerializer
from cart.views import get_or_create_cart

from .models import Coupon
from .serializers import CouponApplySerializer
from .utils import CouponError, check_coupon


@api_view(['POST'])
def apply_coupon(request):
    """Attach a coupon to the cart.

    The coupon is stored on the cart, not just priced and returned - checkout
    reads it from there. Usage is *not* consumed here; that happens when an
    order is actually created (see coupons.utils.record_usage).
    """
    serializer = CouponApplySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    coupon = Coupon.objects.get(code=serializer.validated_data['code'])
    cart = get_or_create_cart(request)

    if not cart.items.exists():
        return Response(
            {'error': True, 'message': 'Your cart is empty', 'code': 'EMPTY_CART'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = request.user if request.user.is_authenticated else None
    try:
        check_coupon(coupon, cart.get_subtotal(), user)
    except CouponError as exc:
        return Response(
            {'error': True, 'message': exc.message, 'code': exc.code},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cart.coupon = coupon
    cart.save(update_fields=['coupon'])

    return Response({'success': True, 'cart': CartSerializer(cart).data})


@api_view(['DELETE'])
def remove_coupon(request):
    cart = get_or_create_cart(request)
    if cart.coupon_id:
        cart.coupon = None
        cart.save(update_fields=['coupon'])
    return Response({'success': True, 'cart': CartSerializer(cart).data})
