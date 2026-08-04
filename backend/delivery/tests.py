from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient

from .models import DeliveryPincode, OutsideStateDeliveryRate, TamilNaduDeliveryRate
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


class ConfigurableRatesTest(TestCase):
    """Rates used to be hardcoded constants; changing a price meant a deploy."""

    def setUp(self):
        self.pincode = DeliveryPincode.objects.create(
            pincode='600001', city='Chennai', delivery_type='local',
            estimated_days_text='2-4 business days',
        )
        self.standard = DeliveryPincode.objects.create(
            pincode='641001', city='Coimbatore', delivery_type='standard',
            estimated_days_text='2-4 business days',
        )
        self.config = TamilNaduDeliveryRate.get_config()

    def quote(self, pincode='600001', **kwargs):
        kwargs.setdefault('state', 'Tamil Nadu')
        kwargs.setdefault('order_total', Decimal('100'))
        return get_delivery_quote(pincode=pincode, **kwargs)

    def test_defaults_match_the_previous_hardcoded_values(self):
        self.assertEqual(self.config.local_charge, Decimal('30'))
        self.assertEqual(self.config.standard_charge, Decimal('80'))
        self.assertEqual(self.config.free_delivery_threshold, Decimal('500'))
        self.assertEqual(self.config.weight_surcharge_per_500g, Decimal('10'))
        self.assertEqual(self.config.weight_allowance_g, 1000)

    def test_config_is_a_singleton(self):
        self.assertEqual(TamilNaduDeliveryRate.objects.count(), 1)
        self.assertEqual(TamilNaduDeliveryRate.get_config().pk, self.config.pk)

    def test_changing_local_charge_changes_the_quote(self):
        self.config.local_charge = Decimal('45')
        self.config.save(update_fields=['local_charge'])
        self.assertEqual(self.quote()['charge'], Decimal('45'))

    def test_changing_standard_charge_changes_the_quote(self):
        self.config.standard_charge = Decimal('99')
        self.config.save(update_fields=['standard_charge'])
        self.assertEqual(self.quote('641001')['charge'], Decimal('99'))

    def test_changing_free_threshold_changes_when_delivery_is_free(self):
        self.assertEqual(self.quote(order_total=Decimal('600'))['charge'], Decimal('0'))

        self.config.free_delivery_threshold = Decimal('2000')
        self.config.save(update_fields=['free_delivery_threshold'])
        self.assertEqual(self.quote(order_total=Decimal('600'))['charge'], Decimal('30'))

    def test_weight_surcharge_uses_configured_rate_and_allowance(self):
        # 1600g = 600g over the 1000g allowance = 2 blocks of 500g = +Rs.20
        self.assertEqual(self.quote(total_weight_g=1600)['charge'], Decimal('50'))

        self.config.weight_surcharge_per_500g = Decimal('25')
        self.config.weight_allowance_g = 500
        self.config.save(update_fields=['weight_surcharge_per_500g', 'weight_allowance_g'])
        # 1600g = 1100g over a 500g allowance = 3 blocks = +Rs.75
        self.assertEqual(self.quote(total_weight_g=1600)['charge'], Decimal('105'))

    def test_pincode_override_still_beats_the_zone_rate(self):
        self.pincode.delivery_charge = Decimal('5')
        self.pincode.save(update_fields=['delivery_charge'])
        self.assertEqual(self.quote()['charge'], Decimal('5'))

    def test_pincode_estimate_falls_back_to_the_config_text(self):
        self.pincode.estimated_days_text = ''
        self.pincode.save(update_fields=['estimated_days_text'])
        self.config.estimated_days_text = '3-5 business days'
        self.config.save(update_fields=['estimated_days_text'])
        self.assertEqual(self.quote()['estimated_days'], '3-5 business days')

    def test_outside_state_weight_surcharge_is_configurable(self):
        outside = OutsideStateDeliveryRate.get_config()
        base = get_delivery_quote(state='Karnataka', total_weight_g=1600,
                                  order_total=Decimal('100'))['charge']
        self.assertEqual(base, outside.base_charge + Decimal('20'))

        outside.weight_surcharge_per_500g = Decimal('40')
        outside.save(update_fields=['weight_surcharge_per_500g'])
        bumped = get_delivery_quote(state='Karnataka', total_weight_g=1600,
                                     order_total=Decimal('100'))['charge']
        self.assertEqual(bumped, outside.base_charge + Decimal('80'))

    def test_checkout_charges_the_configured_rate(self):
        self.config.local_charge = Decimal('55')
        self.config.save(update_fields=['local_charge'])
        self.assertEqual(
            calculate_delivery_charge(pincode='600001', state='Tamil Nadu',
                                      order_total=Decimal('100')),
            Decimal('55'),
        )
