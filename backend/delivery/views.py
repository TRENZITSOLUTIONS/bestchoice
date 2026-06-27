from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DeliveryPincode


@api_view(['GET'])
def check_pincode(request, pincode):
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
        'delivery_available': record.delivery_type != 'none',
        'delivery_type': record.delivery_type,
        'estimated_days': record.estimated_days_text,
        'store_pickup': record.store_pickup_available,
        'cod_available': record.cod_available,
        'delivery_charge': str(record.delivery_charge) if record.delivery_charge else None,
    })
