# Loyalty Points System

> **Implementation Status**: ✅ = Built · 🚧 = Not yet implemented

## Rules

| Action | Points Earned/Spent | Status |
|---|---|---|
| Registration welcome bonus | 50 points | ✅ |
| Order placed (per ₹100) | 1 point (e.g., ₹1299 order → 12 points) | ✅ |
| Points reversed on cancellation | Deducted | ✅ |
| Referral bonus (both referrer & new user) | 50 points each | ✅ |
| Birthday bonus | 100 points | ✅ |
| Redeem during checkout | 1 point = ₹1 | ✅ |
| Max redeem per order | 20% of order value | 🚧 (not currently enforced - checkout only caps redemption at the order subtotal) |
| Review with photo | 20 points | 🚧 |
| First order bonus | 100 points | 🚧 |
| Points expiry | 365 days | ✅ |

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

- Customer enters points on checkout page (max 20% of order value)
- Points passed as `loyalty_points_used` in checkout request
- API validates: user has enough points, ≤ 20% of order subtotal
- Points NOT deducted at checkout creation — deducted on payment verification
- On payment verify (`POST /payment/verify/`): points deducted + `LoyaltyTransaction(spent)` created
- On payment webhook (`payment.captured`): same deduction logic
- If order cancelled: points restored + `LoyaltyTransaction(refund)` created

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
