# Coupon Codes

> **Implementation Status**: ✅ = Built · 🚧 = Not yet implemented

## Coupon Rules

| Rule | Description | Status |
|---|---|---|
| Discount types | Percentage (%) or Fixed (₹) | ✅ |
| Min cart value | Coupon only applies if cart subtotal ≥ min value | ✅ |
| Max discount cap | For % coupons, max ₹ discount | ✅ |
| Usage limit | Max number of times coupon can be used globally | ✅ |
| Per-user limit | Max once per customer | ✅ |
| Valid date range | `valid_from` to `valid_till` | ✅ (backend stores fields) |
| Active toggle | Enable/disable without deleting | ✅ |

## How It Works (User Flow)

1. User adds items to cart
2. On cart page, enters coupon code in input field
3. Clicks "Apply"
4. API validates:
   - Code exists & active
   - Within valid date range
   - Usage limit not exhausted
   - Cart subtotal ≥ min_cart_value
5. If valid → the computed discount is **returned in the response**, and `used_count` is
   incremented and a `CouponUsage` row written immediately
6. If invalid → error message shown ("Invalid coupon" / "Expired" / "Min cart ₹999 required")

## 🚧 Coupons do not currently reduce what a customer pays

Validation and discount *calculation* work. Nothing applies the result to an order.
Do not treat this feature as usable until the gaps below are closed.

- **`Cart` has no coupon field.** The discount is computed per request and returned;
  nothing persists which coupon is applied. `CartSerializer` returns only
  `id / items / subtotal / total`, with `total == subtotal`. The cart page reads
  `cart.coupon` and `cart.discount`, which are always `undefined`.
- **Checkout ignores coupons entirely.** `CheckoutSerializer` has no coupon field, and
  `checkout()` never reads one — it sets `order.discount` from loyalty points only. The
  `Order.coupon` foreign key exists but is never populated. A customer can enter a valid
  code, see a discount, and still be charged the full amount.
- **Usage is burned at apply time, not order time.** `used_count` and `CouponUsage` are
  written when the code is *applied*, before any order exists. With the default
  `per_user_limit` of 1, a customer who applies a code and abandons the cart is
  permanently locked out of it — and never got the discount.
- **`remove_coupon` is a no-op.** It returns `{"success": true}` without doing anything,
  because there is nothing stored to remove.

Closing this needs a decision on where the applied coupon lives — a field on `Cart`
(server-side, survives sessions) or a code passed through to `POST /checkout/`
(stateless, simpler) — plus moving usage tracking to order creation.

## Intended Checkout Behavior (once the above is fixed)

- Coupon discount shown separately: `Subtotal - Discount + Delivery = Total`
- User can remove coupon and apply another
- If cart changes (item removed), coupon re-validated on next API call
- Only **one coupon per order**

## Models

```python
class Coupon(models.Model):
    code = models.CharField(max_length=20, unique=True)
    discount_type = models.CharField(max_length=10, choices=[('percentage', 'Percentage'), ('fixed', 'Fixed')])
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_cart_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # cap for %
    valid_from = models.DateTimeField()
    valid_till = models.DateTimeField()
    usage_limit = models.IntegerField(default=0)  # 0 = unlimited
    used_count = models.IntegerField(default=0)
    per_user_limit = models.IntegerField(default=1)  # times per user
    is_active = models.BooleanField(default=True)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

## API

### POST /api/cart/apply-coupon/
```json
{ "code": "WELCOME20" }
// Success: 200
{
  "success": true,
  "discount": 259.80,
  "discount_label": "20% off",
  "total": 2338.20,
  "coupon": { "code": "WELCOME20", "discount_percent": 20, "max_discount": 500 }
}
// Error: 400
{ "error": true, "message": "Coupon expired", "code": "COUPON_EXPIRED" }
// Error: 400
{ "error": true, "message": "Minimum cart value ₹999 required", "code": "MIN_CART" }
```

### DELETE /api/cart/remove-coupon/
```json
// Response: 200
{ "success": true, "message": "Coupon removed" }
```

## Admin — Coupon Management 🚧

In the custom dashboard (`/admin/coupons`):

- **Create**: Form with all fields, preview of discount calculation
- **List**: Table with code, type, value, used/total, valid dates, active badge
- **Toggle**: Active/inactive switch
- **Edit**: Modify any field
- **Stats**: Total usage, total discount given (sum across orders)

## Sample Coupons for Launch

| Code | Type | Value | Min Cart | Max Disc | Valid |
|---|---|---|---|---|---|
| WELCOME20 | % | 20% | ₹999 | ₹500 | 30 days |
| FIRST100 | fixed | ₹100 | ₹499 | — | 30 days |
| FREEDEL | % | 0% | ₹999 | ₹0 | (free delivery logic) |
| PONGAL50 | % | 15% | ₹1499 | ₹750 | Pongal week |
