# Loyalty Points System

> **Implementation Status**: ✅ = Built · 🚧 = Not yet implemented

## Rules

| Action | Points Earned/Spent | Status |
|---|---|---|
| Registration welcome bonus | 50 points | ✅ |
| Order placed (per ₹100) | 5 points (e.g., ₹1299 order → 65 points) | ✅ |
| Points reversed on cancellation | Deducted | ✅ |
| Referral bonus (both referrer & new user) | 50 points each | ✅ |
| Birthday bonus | 100 points | ✅ |
| Redeem during checkout | 1 point = ₹1 | ✅ |
| Max redeem per order | 20% of order value | ✅ |
| Review with photo | 20 points | 🚧 |
| First order bonus | 100 points | 🚧 |
| Points expiry | 365 days | 🚧 |

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

## Points Expiry 🚧

- Points valid for 365 days from earning — not yet tracked
- Expired points shown separately on loyalty page — not yet tracked

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
```

## API

### GET /api/loyalty/balance/
```json
{ "points": 250, "pending_expiry": 0, "lifetime_earned": 1200, "lifetime_spent": 950 }
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
