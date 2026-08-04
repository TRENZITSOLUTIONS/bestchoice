# Delivery & Logistics (Tamil Nadu + Rest of India)

> **Implementation Status**: ✅ = Built · 🚧 = Not yet implemented

## Two Delivery Zones

Delivery is priced differently depending on the `state` in the shipping address (`delivery/utils.py: get_delivery_quote`):

| Zone | Pricing | Status |
|---|---|---|
| **Tamil Nadu** (`state` matches "Tamil Nadu" / "Tamilnadu" / "TN", case-insensitive — also the default when no `state` is given) | Per-pincode via `DeliveryPincode` (local/standard/none rate zone, optional per-pincode override) | ✅ |
| **Outside Tamil Nadu** (any other `state`) | Single configurable rate card — `delivery.OutsideStateDeliveryRate`, editable in Django Admin | ✅ |

Both zones apply a weight surcharge (₹10 per 500g over 1kg by default, configurable per zone) and go through `POST /checkout/`, which now rejects the order with 400 if `get_delivery_quote(...)['available']` is `False` for `delivery_type: "home"` (store pickup skips this check).

## Delivery Options (Tamil Nadu zone)

**Same-day delivery is not offered.** Every Tamil Nadu pincode quotes 2-4 business
days, matching the shipping policy. `delivery_type` is a *price zone*, not a speed:

| Rate zone | Availability | Default cost | Status |
|---|---|---|---|
| Local (Chennai metro) | 81 Chennai pincodes | ₹30 | ✅ |
| Standard | The other 307 Tamilnadu pincodes | ₹80 | ✅ |
| Free Delivery | Orders at or above ₹500 | ₹0 | ✅ |
| Store Pickup | Select pickup locations | ₹0 | ✅ |

**Every figure here is editable, no deploy needed.** See [Rate cards](#rate-cards).

## Pincode-Based Logic

1. Customer enters pincode on product page or checkout
2. API: `GET /api/delivery/check/{pincode}/` ✅
3. Returns (Tamil Nadu pincode):
```json
{
  "pincode": "600001",
  "city": "Chennai",
  "zone": "tamilnadu",
  "delivery_available": true,
  "delivery_type": "local",
  "estimated_days": "2-4 business days",
  "store_pickup": true,
  "cod_available": true,
  "delivery_charge": "30.00",
  "free_delivery_threshold": "500.00"
}
```
`delivery_charge` is the full charge for that zone. Pass `?order_total=<amount>` to have
the free-delivery threshold applied, which is what the checkout page does so its summary
matches what the server will charge.

Pass `?state=<state>` to check a non-Tamil-Nadu address against the outside-state rate card instead, e.g. `GET /api/delivery/check/560001/?state=Karnataka`:
```json
{
  "pincode": "560001",
  "zone": "outside_tamilnadu",
  "delivery_available": true,
  "delivery_type": "standard",
  "estimated_days": "5-8 business days",
  "store_pickup": false,
  "cod_available": false,
  "delivery_charge": "150.00"
}
```

## Pincode Model

| Field | Description |
|---|---|
| pincode | 6-digit pincode (unique) |
| city | City name |
| state | Default: Tamilnadu |
| delivery_type | `local` (Chennai metro, ₹30), `standard` (₹80), or `none` (not served) — a price zone, not a speed |
| estimated_days_text | Free text shown to the customer. Seeded as "2-4 business days" everywhere in Tamil Nadu |
| store_pickup | Boolean |
| cod_available | Boolean |
| delivery_charge | Decimal (override, null by default) |

## Delivery Charge Calculation

Calculated in `delivery/utils.py` at checkout time:

| Factor | Default | Where it comes from |
|---|---|---|
| Base charge | ₹30 (`local`) / ₹80 (`standard`) | `TamilNaduDeliveryRate`, or the pincode's own `delivery_charge` override |
| Weight surcharge | ₹10 per 500g over 1kg (based on `product.weight_g`) | `TamilNaduDeliveryRate` |
| Free threshold | Orders at or above ₹500 | `TamilNaduDeliveryRate` |
| Store pickup | ₹0 | Incidental — see [Store Pickup](#store-pickup) |

## Rate cards

Both zones read an admin-editable singleton, so prices change from Django Admin
rather than a code deploy. Django Admin → **Delivery**:

| Record | Fields |
|---|---|
| **Tamil Nadu delivery rate** | `local_charge`, `standard_charge`, `free_delivery_threshold`, `weight_surcharge_per_500g`, `weight_allowance_g`, `estimated_days_text` |
| **Outside Tamil Nadu delivery rate** | `base_charge`, `free_delivery_threshold`, `weight_surcharge_per_500g`, `weight_allowance_g`, `estimated_days_text`, `cod_available`, `is_active` |

Both rows are created lazily on first read via `get_config()`, cannot be deleted, and
cannot be duplicated. Defaults match the values that used to be hardcoded, so nothing
changed behaviourally when they became configurable.

Precedence for a Tamil Nadu pincode: its own `delivery_charge` if set, otherwise the
zone charge from the rate card. Staff can see both cards read-only at `/staff/delivery`.

The entry point checkout actually calls is `get_delivery_quote`, which returns
availability, charge, estimate, COD and zone together:

```python
get_delivery_quote(pincode='', state='', total_weight_g=0, order_total=Decimal('0'))
# -> {'available', 'charge', 'estimated_days', 'cod_available', 'delivery_type', 'zone'}
```

It branches on `state`: Tamil Nadu (or a blank state) is priced per-pincode from
`DeliveryPincode`, anything else from the single `OutsideStateDeliveryRate` card.
`calculate_delivery_charge(...)` is a thin wrapper returning just the charge, kept
for backward compatibility — it assumes availability was already checked.

Note there is no explicit store-pickup branch; pickup comes out free only because
the frontend leaves the pincode blank when pickup is selected.

### Management Commands

```bash
# Seed 388 Tamilnadu pincodes
python manage.py seed_pincodes

# Import from government CSV
python manage.py import_pincodes path/to/pincodes.csv

# Generate sample CSV template
python manage.py import_pincodes --sample

# Clear and re-import
python manage.py import_pincodes path/to/file.csv --clear
```

## Store Pickup

Checkout offers a single pickup point — the Spencer Plaza branch, hardcoded in the
checkout page. There is no pickup-location model, so additional branches cannot be
configured without code changes.

Pickup is free, but only incidentally: `calculate_delivery_charge` has no
`store_pickup` branch. Selecting pickup hides the address form, which leaves the
pincode empty, which yields a zero charge. Adding a real pickup-vs-delivery rule
would need an explicit check in `backend/delivery/utils.py`.

## Shipping Partners (to integrate) 🚧

1. Delhivery
2. Blue Dart
3. DTDC
4. India Post (for remote pincodes)

## Tracking Flow 🚧

```
Order Placed → Confirmed → Packed → Shipped (tracking# assigned) → In Transit → Out for Delivery → Delivered

At each stage:
- Status updates on order page
- Optional SMS/WhatsApp notification to customer
```

## Refund Flow

```
Customer requests refund (within policy window)
  → Admin approves
  → Razorpay refund API called (auto to source) ✅
  → Customer notified 🚧
  → Stock restored ✅
  → Loyalty points adjusted (deduct if earned from this order) ✅
```

## Return Policy

| Condition | Policy |
|---|---|
| Return window | 7 days from delivery |
| Condition | Unused, tags intact |
| Size exchange | Available |
| Refund method | Original payment source (Razorpay) |
| Refund time | 3-5 business days |
| Pickup | Free pickup arranged |
