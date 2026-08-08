from decimal import Decimal, InvalidOperation

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import DeliveryPincode, OutsideStateDeliveryRate, TamilNaduDeliveryRate
from .utils import get_delivery_quote


@api_view(['GET'])
def check_pincode(request, pincode):
    """Quote delivery for a pincode.

    Both zones go through get_delivery_quote so the charge always reflects the
    admin-configured rate card. Pass ?order_total= to account for the free
    delivery threshold; without it the full charge is quoted.
    """
    state = request.GET.get('state', '')

    try:
        order_total = Decimal(request.GET.get('order_total') or '0')
    except (InvalidOperation, TypeError):
        order_total = Decimal('0')

    quote = get_delivery_quote(pincode=pincode, state=state, order_total=order_total)

    if not quote['available']:
        return Response({
            'pincode': pincode,
            'zone': quote['zone'],
            'delivery_available': False,
            'message': 'Delivery is not available at this pincode',
        })

    # Derived from the quote's own zone, not re-checked from `state` - a
    # state-less request can still resolve to either zone (see
    # get_delivery_quote), so re-deriving it here from `state` alone would
    # disagree with which rate/city record the quote actually used.
    outside = quote['zone'] == 'outside_tamilnadu'
    if outside:
        record = None
        threshold = OutsideStateDeliveryRate.get_config().free_delivery_threshold
    else:
        record = DeliveryPincode.objects.filter(pincode=pincode, is_active=True).first()
        threshold = TamilNaduDeliveryRate.get_config().free_delivery_threshold

    return Response({
        'pincode': pincode,
        'city': record.city if record else '',
        'zone': quote['zone'],
        'delivery_available': True,
        'delivery_type': quote['delivery_type'],
        'estimated_days': quote['estimated_days'],
        'store_pickup': record.store_pickup_available if record else False,
        'cod_available': quote['cod_available'],
        'delivery_charge': str(quote['charge']),
        'free_delivery_threshold': str(threshold),
    })
