# Inventory Setup Guide

> **Implementation Status**: ✅ = Built · 🚧 = Not yet implemented

## Inventory Flow (Detailed)

```
Supplier delivers goods
  ↓
Warehouse team receives & inspects
  ↓
Enter into system (Django Admin):
  Product created with all attributes
  ↓
SKU auto-generated for each variant:
  Format: BC-{category_code}-{product_id}-{COLOR}-{SIZE}
  Example: BC-SHT-001-RED-M
  ↓
Product images uploaded → auto-sizes generated → pushed to S3
  ↓
Product goes live on website (if is_active=True)
  ↓
Customer orders → stock deducted atomically
  ↓
If stock < reorder_level → admin gets low-stock alert
  ↓
Order packed → status updated → tracking added
```

## Category → SKU Code Mapping

| Category | Code | Example |
|---|---|---|
| Men's Shirts | SHT | BC-SHT-001 |
| Men's T-Shirts | TSH | BC-TSH-001 |
| Men's Jeans | JNS | BC-JNS-001 |
| Men's Trousers | TRS | BC-TRS-001 |
| Men's Blazers | BLZ | BC-BLZ-001 |
| Men's Ethnic Wear | ETH | BC-ETH-001 |
| Women's Sarees | SAR | BC-SAR-001 |
| Women's Kurtis | KUR | BC-KUR-001 |
| Women's Dresses | DRS | BC-DRS-001 |
| Women's Tops | TOP | BC-TOP-001 |
| Kids Wear | KID | BC-KID-001 |
| Cosmetics | COS | BC-COS-001 |

## Stock Deduction Logic

```python
# On order placed (in transaction)
def place_order(user, cart, ...):
    with transaction.atomic():
        order = Order.objects.create(...)
        for item in cart.items.all():
            variant = item.variant
            if variant.stock < item.quantity:
                raise InsufficientStock(variant.sku)
            variant.stock -= item.quantity
            variant.save()
            OrderItem.objects.create(order=order, ...)
        cart.items.all().delete()
```

## Stock Restoration

```python
# On order cancellation
def cancel_order(order):
    with transaction.atomic():
        for item in order.items.all():
            if item.variant:
                item.variant.stock += item.quantity
                item.variant.save()
        order.status = 'cancelled'
        order.save()
```

## Low Stock Alert

- Threshold: stock ≤ 5
- On any stock update, if variant stock ≤ 5 → create alert notification
- Displayed on admin dashboard: "⚠ 12 products are running low on stock"
- Email notification to admin (optional, can add later)

## Bulk Upload Format (CSV/Excel) 🚧

| Column | Required | Description |
|---|---|---|
| name | Yes | Product name |
| category | Yes | Category slug (e.g., shirts) |
| brand | Yes | Brand slug |
| mrp | Yes | Max retail price |
| selling_price | Yes | Selling price |
| short_description | No | Brief description |
| description | No | Full description (HTML) |
| color | Yes | Color name |
| size | Yes | Size label |
| stock | Yes | Initial stock quantity |
| images | No | Comma-separated filenames or URLs |
| highlights | No | Pipe-separated (e.g., "Cotton|Slim Fit|Soft") |
| is_active | No | 1 or 0 |

## Reorder Logic (Future Enhancement) 🚧

Once order volume justifies it:
- Set `reorder_level` per variant
- When stock hits reorder level → auto-generate purchase order email to supplier
- Track incoming stock via `PendingReceipt` model
