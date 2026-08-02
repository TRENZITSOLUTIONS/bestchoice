from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DeliveryPincode
from .utils import get_delivery_quote, is_tamil_nadu


@api_view(['GET'])
def check_pincode(request, pincode):
    state = request.GET.get('state', '')

    if state and not is_tamil_nadu(state):
        quote = get_delivery_quote(pincode=pincode, state=state)
        return Response({
            'pincode': pincode,
            'zone': quote['zone'],
            'delivery_available': quote['available'],
            'delivery_type': quote['delivery_type'],
            'estimated_days': quote['estimated_days'],
            'store_pickup': False,
            'cod_available': quote['cod_available'],
            'delivery_charge': str(quote['charge']) if quote['available'] else None,
        })

    try:
        record = DeliveryPincode.objects.get(pincode=pincode, is_active=True)
    except DeliveryPincode.DoesNotExist:
        return Response({
            'pincode': pincode,
            'delivery_available': False,
            'message': 'Delivery not available at this pincode',
        })

    return Response({
        'pincode': record.pincode,
        'city': record.city,
        'zone': 'tamilnadu',
        'delivery_available': record.delivery_type != 'none',
        'delivery_type': record.delivery_type,
        'estimated_days': record.estimated_days_text,
        'store_pickup': record.store_pickup_available,
        'cod_available': record.cod_available,
        'delivery_charge': str(record.delivery_charge) if record.delivery_charge else None,
    })
