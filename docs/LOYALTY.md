# Loyalty Points System

## Rules

| Action | Points Earned/Spent |
|---|---|
| Registration | 50 points |
| Order placed (per ₹100) | 5 points (e.g., ₹1299 order → 65 points) |
| Review with photo | 20 points |
| First order bonus | 100 points |
| Birthday bonus | 100 points |
| Redeem | 1 point = ₹1 |
| Max redeem per order | 20% of order value |

## Redemption

- Customer applies points during checkout
- API validates: points ≥ order total × 20% max
- Points deducted immediately
- If order cancelled, points restored

## Points Expiry

- Points valid for 365 days from earning
- Expired points shown separately on loyalty page

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
