from decimal import Decimal
from .models import DeliveryPincode


FREE_DELIVERY_THRESHOLD = Decimal('500')
BASE_CHARGES = {
    'same_day': Decimal('30'),
    'standard': Decimal('80'),
}
WEIGHT_SURCHARGE_PER_500G = Decimal('10')
WEIGHT_THRESHOLD_G = 1000


def calculate_delivery_charge(pincode: str, total_weight_g: int = 0, order_total: Decimal = Decimal('0')):
    if order_total >= FREE_DELIVERY_THRESHOLD:
        return Decimal('0')

    try:
        pincode_obj = DeliveryPincode.objects.get(pincode=pincode, is_active=True)
    except DeliveryPincode.DoesNotExist:
        return Decimal('0')

    if pincode_obj.delivery_charge is not None:
        charge = pincode_obj.delivery_charge
    else:
        charge = BASE_CHARGES.get(pincode_obj.delivery_type, Decimal('80'))

    if total_weight_g > WEIGHT_THRESHOLD_G:
        extra_units = (total_weight_g - WEIGHT_THRESHOLD_G + 499) // 500
        charge += extra_units * WEIGHT_SURCHARGE_PER_500G

    return charge
