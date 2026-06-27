# Delivery & Logistics (Tamilnadu)

> **Implementation Status**: ✅ = Built · 🚧 = Not yet implemented

## Delivery Options

| Type | Availability | Cost | Status |
|---|---|---|---|
| Same Day Delivery | Chennai pincodes only | ₹49 | ✅ |
| Standard Delivery | All Tamilnadu pincodes | ₹79 | ✅ |
| Free Delivery | Orders above ₹999 | ₹0 | ✅ |
| Store Pickup | Select pickup locations | ₹0 | ✅

## Pincode-Based Logic

1. Customer enters pincode on product page or checkout
2. API: `GET /api/delivery/check/{pincode}/` ✅
3. Returns:
```json
{
  "pincode": "600001",
  "city": "Chennai",
  "delivery_available": true,
  "delivery_type": "same_day",
  "estimated_days": "Today",
  "store_pickup": true,
  "pickup_locations": [
    { "name": "BestChoice - Anna Nagar", "address": "..." }
  ],
  "cod_available": true
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

## Delivery Charge Logic

- Same Day: ₹49
- Standard: ₹79
- Free: subtotal > ₹999
- Store Pickup: ₹0

### 🚧 Charge Calculation
Delivery charge logic is documented but not implemented in backend code. Currently, `delivery_charge` is stored per-pincode but not calculated dynamically.

## Store Pickup Locations

| Location | Address | Contact |
|---|---|---|
| Chennai - Anna Nagar | 123, 2nd Avenue, Anna Nagar | 9876543210 |
| Chennai - T Nagar | 45, Pondy Bazaar, T Nagar | 9876543211 |
| Coimbatore | 78, Cross Cut Road | 9876543212 |
| Madurai | 12, North Veli Street | 9876543213 |

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
