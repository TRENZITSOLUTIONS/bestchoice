# Loyalty Points System

> **Implementation Status**: ✅ = Built · 🚧 = Not yet implemented

## Configuration ✅

Every rate/threshold in the program is admin-editable at runtime via the `LoyaltyConfig` singleton (Django Admin → Loyalty → Loyalty program configuration) — no code change or deploy needed to retune the program:

| Field | Default | Controls |
|---|---|---|
| `points_per_100_spent` | 1 | Points earned per ₹100 of order subtotal |
| `point_value_rupees` | ₹1.00 | Rupee value of 1 point when redeemed |
| `validity_days` | 365 | Days after earning before a batch of points expires |
| `max_redeem_percent` | 20 | Max % of order subtotal payable with points, per order |
| `welcome_bonus_points` | 50 | Registration welcome bonus |
| `referral_bonus_points` | 50 | Given to both referrer and new user |
| `birthday_bonus_points` | 100 | Birthday bonus |
| `expiring_soon_window_days` | 30 | Window for the "expiring soon" balance warning |

Changing a rate only affects points earned/redeemed *after* the change — already-earned batches keep whatever `expires_at` they were given at the time (see `loyalty/models.py: LoyaltyConfig`, `loyalty/utils.py`).

## Rules

| Action | Points Earned/Spent | Status |
|---|---|---|
| Registration welcome bonus | `welcome_bonus_points` (default 50) | ✅ |
| Order placed (per ₹100) | `points_per_100_spent` (default 1; e.g., ₹1299 order → 12 points) | ✅ |
| Points reversed on cancellation | Deducted | ✅ |
| Referral bonus (both referrer & new user) | `referral_bonus_points` (default 50) each | ✅ |
| Birthday bonus | `birthday_bonus_points` (default 100) | ✅ |
| Redeem during checkout | `point_value_rupees` (default 1 point = ₹1) | ✅ |
| Max redeem per order | `max_redeem_percent` (default 20%) of order subtotal - enforced, checkout returns 400 if exceeded | ✅ |
| Review with photo | 20 points | 🚧 |
| First order bonus | 100 points | 🚧 |
| Points expiry | `validity_days` (default 365) | ✅ |

## Referral Bonus

- User model has `referral_code` (auto-generated on create) and `referred_by` FK
- Registration accepts optional `referral_code` field
- Valid referral → 50 points to referrer + 50 points to new user
- Points credited immediately upon registration

## Birthday Bonus

- User model has `date_of_birth` field
- Run via management command:
  ```bash
  python manage.py give_birthday_bonus
  ```
- Awards 100 points to users whose birthday is today
- Safe to run daily via cron

## Redemption ✅

- Customer enters points on checkout page (max `max_redeem_percent` of order value, default 20%)
- Points passed as `loyalty_points_used` in checkout request
- API validates: user has enough points, ≤ `max_redeemable_points(subtotal)` (400 if exceeded)
- Points NOT deducted at checkout creation — deducted on payment verification
- On payment verify (`POST /payment/verify/`): points deducted + `LoyaltyTransaction(spent)` created
- On payment webhook (`payment.captured`): same deduction logic
- If order cancelled: points restored + `LoyaltyTransaction(refund)` created

## Exclusions ✅

Points are not earned/kept for:
- **Shipping charges** — `points_for_order_subtotal` is computed from `order.subtotal`, which excludes `delivery_charge`
- **Cancelled orders** — `cancel_order` reverses any points earned on that order (`reverse_earned_points`)
- **Refunded orders** — approving a refund (`POST /admin/refunds/{id}/status/` with `status: approved` or `processed`) reverses whatever points remain from that order's earn batch, same mechanism as cancellation. Merely *requesting* a refund does not reverse points — only an admin approving/processing it does, so a rejected refund request doesn't cost the customer anything
- **Guest checkout** — not applicable; `/checkout/` requires authentication, so there's no guest order to exclude

## Points Expiry ✅

Each earn (or restored-on-cancellation credit) is its own independently-expiring batch, not a single running total:

- `LoyaltyTransaction.remaining` — how many points from that specific batch are still unspent
- `LoyaltyTransaction.expires_at` — set automatically on creation, `created_at + 365 days`
- Redemption (`loyalty.utils.consume_points`) spends FIFO across active (unexpired, `remaining > 0`) batches, oldest first — points closest to lapsing get used before newer ones
- `python manage.py expire_loyalty_points` zeroes out any batch whose `expires_at` has passed, logs a matching `LoyaltyTransaction(type='expired')`, and deducts the user's balance. Safe to run daily via cron (same pattern as `give_birthday_bonus`)
- `GET /api/loyalty/balance/` includes `expiring_soon` (points lapsing within 30 days) and `next_expiry_date`

## Models

```python
class LoyaltyTransaction(models.Model):
    user = ForeignKey(User)
    points = IntegerField()  # positive = earned, negative = spent
    type = CharField(choices=[
        ('earned', 'Earned'),
        ('spent', 'Spent'),
        ('expired', 'Expired'),
        ('refund', 'Refund'),
    ])
    order = ForeignKey(Order, null=True, blank=True)
    description = CharField(max_length=255)
    created_at = DateTimeField(auto_now_add=True)
    remaining = IntegerField(default=0)  # unspent points left in this batch (positive-points rows only)
    expires_at = DateTimeField(null=True, blank=True)  # set automatically: created_at + 365 days
```

## API

### GET /api/loyalty/balance/
```json
{ "points": 250, "lifetime_earned": 1200, "lifetime_spent": 950, "expiring_soon": 40, "next_expiry_date": "2027-01-15" }
```

### GET /api/loyalty/transactions/
```json
{
  "results": [
    { "points": 65, "type": "earned", "description": "Order BC-ORD-001", "date": "2026-06-20" },
    { "points": -200, "type": "spent", "description": "Redeemed on BC-ORD-002", "date": "2026-06-22" }
  ]
}
```
