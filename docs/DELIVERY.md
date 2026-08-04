# Delivery & Logistics (Tamil Nadu + Rest of India)

> **Implementation Status**: ✅ = Built · 🚧 = Not yet implemented

## Two Delivery Zones

Delivery is priced differently depending on the `state` in the shipping address (`delivery/utils.py: get_delivery_quote`):

| Zone | Pricing | Status |
|---|---|---|
| **Tamil Nadu** (`state` matches "Tamil Nadu" / "Tamilnadu" / "TN", case-insensitive — also the default when no `state` is given) | Per-pincode via `DeliveryPincode` (same-day/standard/none, optional per-pincode override) | ✅ |
| **Outside Tamil Nadu** (any other `state`) | Single configurable rate card — `delivery.OutsideStateDeliveryRate` (base charge, free-delivery threshold, estimated days, COD availability, on/off switch), editable in Django Admin | ✅ |

Both zones apply the same weight surcharge (₹10 per 500g over 1kg) and go through `POST /checkout/`, which now rejects the order with 400 if `get_delivery_quote(...)['available']` is `False` for `delivery_type: "home"` (store pickup skips this check).

## Delivery Options (Tamil Nadu zone)

| Type | Availability | Cost | Status |
|---|---|---|---|
| Same Day Delivery | Chennai pincodes only | ₹30 | ✅ |
| Standard Delivery | All Tamilnadu pincodes | ₹80 | ✅ |
| Free Delivery | Orders above ₹500 | ₹0 | ✅ |
| Store Pickup | Select pickup locations | ₹0 | ✅

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
  "delivery_type": "same_day",
  "estimated_days": "Today",
  "store_pickup": true,
  "cod_available": true
}
```
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
| delivery_type | `same_day`, `standard`, or `none` |
| estimated_days_text | "Today", "1-2 days", "2-3 days" |
| store_pickup | Boolean |
| cod_available | Boolean |
| delivery_charge | Decimal (override, null by default) |

### Management Commands

## Delivery Charge Calculation

Calculated in `delivery/utils.py` at checkout time:

| Factor | Detail |
|---|---|
| Base charge | ₹30 (same_day) / ₹80 (standard) |
| Weight surcharge | ₹10 per 500g over 1kg (based on `product.weight_g`) |
| Free threshold | Orders above ₹500 get free delivery |
| Store pickup | ₹0 |

```python
def calculate_delivery_charge(pincode, items, delivery_type, order_total):
    # 1. Free over ₹500
    if order_total >= Decimal("500"):
        return Decimal("0")
    # 2. Store pickup = free
    if delivery_type == "pickup":
        return Decimal("0")
    # 3. Base charge by type
    if delivery_type == "same_day":
        charge = Decimal("30")
    else:
        charge = Decimal("80")
    # 4. Weight surcharge
    total_weight_g = sum(item.product.weight_g * item.quantity for item in items)
    if total_weight_g > 1000:
        extra_kg = (total_weight_g - 1000 + 499) // 500
        charge += Decimal("10") * extra_kg
    return charge
```

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
