# Coupon Codes

## Coupon Rules

| Rule | Description |
|---|---|
| Discount types | Percentage (%) or Fixed (₹) |
| Min cart value | Coupon only applies if cart subtotal ≥ min value |
| Max discount cap | For % coupons, max ₹ discount (e.g., 20% off up to ₹500) |
| Usage limit | Max number of times coupon can be used globally |
| Per-user limit | Max once per customer (optional) |
| Valid date range | `valid_from` to `valid_till` |
| Active toggle | Enable/disable without deleting |

## How It Works (User Flow)

1. User adds items to cart
2. On cart page, enters coupon code in input field
3. Clicks "Apply"
4. API validates:
   - Code exists & active
   - Within valid date range
   - Usage limit not exhausted
   - Cart subtotal ≥ min_cart_value
5. If valid → discount applied, coupon `used_count` incremented
6. If invalid → error message shown ("Invalid coupon" / "Expired" / "Min cart ₹999 required")

## Checkout Behavior

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

## Admin — Coupon Management

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
