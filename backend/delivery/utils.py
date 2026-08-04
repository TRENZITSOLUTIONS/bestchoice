from decimal import Decimal
from .models import DeliveryPincode, OutsideStateDeliveryRate


FREE_DELIVERY_THRESHOLD = Decimal('500')
BASE_CHARGES = {
    'local': Decimal('30'),
    'standard': Decimal('80'),
}
WEIGHT_SURCHARGE_PER_500G = Decimal('10')
WEIGHT_THRESHOLD_G = 1000

TAMIL_NADU_ALIASES = {'tamilnadu', 'tn'}


def is_tamil_nadu(state: str) -> bool:
    normalized = (state or '').strip().lower().replace(' ', '')
    return normalized in TAMIL_NADU_ALIASES


def _weight_surcharge(total_weight_g: int) -> Decimal:
    if total_weight_g > WEIGHT_THRESHOLD_G:
        extra_units = (total_weight_g - WEIGHT_THRESHOLD_G + 499) // 500
        return extra_units * WEIGHT_SURCHARGE_PER_500G
    return Decimal('0')


def _quote_within_tamil_nadu(pincode: str, total_weight_g: int, order_total: Decimal) -> dict:
    try:
        pincode_obj = DeliveryPincode.objects.get(pincode=pincode, is_active=True)
    except DeliveryPincode.DoesNotExist:
        return {
            'available': False, 'charge': Decimal('0'), 'estimated_days': '',
            'cod_available': False, 'delivery_type': 'none', 'zone': 'tamilnadu',
        }

    if pincode_obj.delivery_type == 'none':
        return {
            'available': False, 'charge': Decimal('0'),
            'estimated_days': pincode_obj.estimated_days_text,
            'cod_available': False, 'delivery_type': 'none', 'zone': 'tamilnadu',
        }

    if order_total >= FREE_DELIVERY_THRESHOLD:
        charge = Decimal('0')
    else:
        charge = pincode_obj.delivery_charge
        if charge is None:
            charge = BASE_CHARGES.get(pincode_obj.delivery_type, Decimal('80'))
        charge += _weight_surcharge(total_weight_g)

    return {
        'available': True, 'charge': charge,
        'estimated_days': pincode_obj.estimated_days_text,
        'cod_available': pincode_obj.cod_available,
        'delivery_type': pincode_obj.delivery_type, 'zone': 'tamilnadu',
    }


def _quote_outside_tamil_nadu(total_weight_g: int, order_total: Decimal) -> dict:
    config = OutsideStateDeliveryRate.get_config()

    if not config.is_active:
        return {
            'available': False, 'charge': Decimal('0'), 'estimated_days': '',
            'cod_available': False, 'delivery_type': 'none', 'zone': 'outside_tamilnadu',
        }

    if order_total >= config.free_delivery_threshold:
        charge = Decimal('0')
    else:
        charge = config.base_charge + _weight_surcharge(total_weight_g)

    return {
        'available': True, 'charge': charge,
        'estimated_days': config.estimated_days_text,
        'cod_available': config.cod_available,
        'delivery_type': 'standard', 'zone': 'outside_tamilnadu',
    }


def get_delivery_quote(pincode: str = '', state: str = '', total_weight_g: int = 0, order_total: Decimal = Decimal('0')) -> dict:
    """
    Tamil Nadu (or no state given, for backward compatibility) is priced per-pincode
    via DeliveryPincode. Any other state uses the single configurable outside-state rate.
    """
    if is_tamil_nadu(state) or not state:
        return _quote_within_tamil_nadu(pincode, total_weight_g, order_total)
    return _quote_outside_tamil_nadu(total_weight_g, order_total)


def calculate_delivery_charge(pincode: str = '', total_weight_g: int = 0, order_total: Decimal = Decimal('0'), state: str = '') -> Decimal:
    """Backward-compatible helper returning just the charge (assumes availability was already checked)."""
    return get_delivery_quote(pincode, state, total_weight_g, order_total)['charge']
