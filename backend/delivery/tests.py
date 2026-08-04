from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient

from .models import DeliveryPincode, OutsideStateDeliveryRate
from .utils import get_delivery_quote, calculate_delivery_charge, is_tamil_nadu


class TamilNaduAliasTest(TestCase):
    def test_recognizes_common_spellings(self):
        self.assertTrue(is_tamil_nadu('Tamil Nadu'))
        self.assertTrue(is_tamil_nadu('Tamilnadu'))
        self.assertTrue(is_tamil_nadu('TN'))
        self.assertFalse(is_tamil_nadu('Kerala'))
        self.assertFalse(is_tamil_nadu(''))


class DeliveryQuoteTest(TestCase):
    def setUp(self):
        self.pincode = DeliveryPincode.objects.create(
            pincode='600001', city='Chennai', delivery_type='local',
            estimated_days_text='2-4 business days', cod_available=True,
        )

    def test_within_tamil_nadu_known_pincode(self):
        quote = get_delivery_quote(pincode='600001', state='Tamil Nadu', order_total=Decimal('100'))
        self.assertTrue(quote['available'])
        self.assertEqual(quote['zone'], 'tamilnadu')
        self.assertEqual(quote['charge'], Decimal('30'))

    def test_within_tamil_nadu_unknown_pincode_is_unavailable(self):
        quote = get_delivery_quote(pincode='999999', state='Tamil Nadu', order_total=Decimal('100'))
        self.assertFalse(quote['available'])

    def test_no_state_defaults_to_tamil_nadu_lookup(self):
        quote = get_delivery_quote(pincode='600001', order_total=Decimal('100'))
        self.assertEqual(quote['zone'], 'tamilnadu')
        self.assertTrue(quote['available'])

    def test_free_delivery_over_threshold_within_tamil_nadu(self):
        quote = get_delivery_quote(pincode='600001', state='Tamil Nadu', order_total=Decimal('600'))
        self.assertEqual(quote['charge'], Decimal('0'))

    def test_outside_tamil_nadu_uses_configurable_rate(self):
        OutsideStateDeliveryRate.objects.create(base_charge=Decimal('200'), free_delivery_threshold=Decimal('1500'))
        quote = get_delivery_quote(pincode='560001', state='Karnataka', order_total=Decimal('100'))
        self.assertTrue(quote['available'])
        self.assertEqual(quote['zone'], 'outside_tamilnadu')
        self.assertEqual(quote['charge'], Decimal('200'))

    def test_outside_tamil_nadu_free_over_its_own_threshold(self):
        OutsideStateDeliveryRate.objects.create(base_charge=Decimal('200'), free_delivery_threshold=Decimal('1000'))
        quote = get_delivery_quote(pincode='560001', state='Karnataka', order_total=Decimal('1200'))
        self.assertEqual(quote['charge'], Decimal('0'))

    def test_outside_tamil_nadu_inactive_is_unavailable(self):
        OutsideStateDeliveryRate.objects.create(is_active=False)
        quote = get_delivery_quote(pincode='560001', state='Karnataka', order_total=Decimal('100'))
        self.assertFalse(quote['available'])

    def test_weight_surcharge_applies_in_both_zones(self):
        tn_quote = get_delivery_quote(pincode='600001', state='Tamil Nadu', total_weight_g=2000, order_total=Decimal('100'))
        self.assertEqual(tn_quote['charge'], Decimal('30') + Decimal('20'))

        OutsideStateDeliveryRate.objects.create(base_charge=Decimal('200'), free_delivery_threshold=Decimal('1500'))
        other_quote = get_delivery_quote(pincode='560001', state='Karnataka', total_weight_g=2000, order_total=Decimal('100'))
        self.assertEqual(other_quote['charge'], Decimal('200') + Decimal('20'))

    def test_backward_compatible_helper_returns_charge_only(self):
        charge = calculate_delivery_charge(pincode='600001', state='Tamil Nadu', order_total=Decimal('100'))
        self.assertEqual(charge, Decimal('30'))


class CheckPincodeViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        DeliveryPincode.objects.create(pincode='600001', city='Chennai', delivery_type='local')

    def test_check_tamil_nadu_pincode(self):
        res = self.client.get('/api/delivery/check/600001/')
        self.assertTrue(res.data['delivery_available'])

    def test_check_outside_state_pincode_with_state_param(self):
        OutsideStateDeliveryRate.objects.create(base_charge=Decimal('200'))
        res = self.client.get('/api/delivery/check/560001/?state=Karnataka')
        self.assertTrue(res.data['delivery_available'])
        self.assertEqual(res.data['zone'], 'outside_tamilnadu')
