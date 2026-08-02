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

Full mapping lives in `products/models.py: CATEGORY_CODES` (source of truth — 34 codes across all 5 top-level categories). Highlights:

| Category | Code | Example |
|---|---|---|
| Men's Shirts | SHT | BC-SHT-001 |
| Men's T-Shirts | TSH | BC-TSH-001 |
| Men's Cargo Pants | CGP | BC-CGP-001 |
| Men's Hoodies | HOD | BC-HOD-001 |
| Women's Sarees | SAR | BC-SAR-001 |
| Women's Leggings | LEG | BC-LEG-001 |
| Women's Night Wear | NGW | BC-NGW-001 |
| Kids' Boys Wear | BOY | BC-BOY-001 |
| Kids' Girls Wear | GRL | BC-GRL-001 |
| Kids' Baby Wear | BBY | BC-BBY-001 |
| Cosmetics Makeup | MUP | BC-MUP-001 |
| Cosmetics Skincare | SKC | BC-SKC-001 |
| Mobile Accessories Chargers | CHG | BC-CHG-001 |
| Mobile Accessories Cases & Covers | CAS | BC-CAS-001 |
| Mobile Accessories Earphones | EAR | BC-EAR-001 |

Run `python manage.py seed_categories` to create the full tree (idempotent, additive — safe to re-run).

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

## Bulk Upload Format (CSV) ✅

Django Admin → Products → **Upload CSV** button (`/admin/products/product/upload-csv/`). Creates base products only — variants (color/size/fabric/fit/shade/volume/stock), images, and highlights are added afterward on each product's edit page, same as a single manually-created product.

| Column | Required | Description |
|---|---|---|
| name | Yes | Product name |
| category_slug | Yes | Category slug (e.g., `shirts`, `chargers`) |
| brand_slug | No | Brand slug |
| mrp | Yes | Max retail price |
| selling_price | Yes | Selling price |
| short_description | No | Brief description |
| description | No | Full description |
| gst_included | No | true/false |
| weight_g | No | Grams (default 500) |
| hide_if_out_of_stock | No | true/false |
| care_instructions | No | Clothing (Men's/Women's/Kids') |
| expiry_date | No | Cosmetics, `YYYY-MM-DD` |
| batch_number | No | Cosmetics |
| ingredients | No | Cosmetics |
| usage_instructions | No | Cosmetics |
| compatible_devices | No | Mobile Accessories |
| warranty | No | Mobile Accessories |

Rows with an unknown `category_slug`/`brand_slug` or missing required fields are skipped and reported per-row; valid rows still get created. "Duplicate selected products" admin action clones a product (+ its images/variants/highlights) as an inactive draft for quick variant-based product creation.

## Reorder Logic (Future Enhancement) 🚧

Once order volume justifies it:
- Set `reorder_level` per variant
- When stock hits reorder level → auto-generate purchase order email to supplier
- Track incoming stock via `PendingReceipt` model
