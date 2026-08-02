# Admin Panels

> **Implementation Status**: ✅ = Built · 🚧 = Page exists but features incomplete · 🚫 = Not built

## 1. Django Admin (Developers)

Used for full backend management. Access at `/admin/`.

### Registered Models ✅
- Users (view, edit, deactivate, reset password)
- Categories (CRUD, reorder, manage tree)
- Brands (CRUD, logo upload)
- Products (CRUD)
- Product Variants (inline on product)
- Product Images (inline on product, sortable)
- Orders (view, update status)
- Coupons (CRUD, usage tracking)
- Reviews (approve/reject)
- Refunds (process)
- Delivery Pincodes (manage)

### Custom Admin Actions
- **Duplicate Product** — copies product + all variants + images + highlights, as an inactive draft ✅
- **Bulk Upload** — "Upload CSV" button on the product changelist creates base products from a CSV (variants added afterward) ✅
- **Mark Orders Shipped** — bulk action with tracking number input 🚧

### Image Processing ✅

Automatic — happens when a product image is uploaded (`ProductImage.save()`): the original is compressed (capped 2000x2000, JPEG q90) and thumb/small/medium/large WebP variants are generated (150/400/800/1200px, q80). No manual step needed.

```
python manage.py process_images
```
Optional maintenance/backfill command to reprocess existing images (e.g. after changing compression settings) — not part of the normal upload flow.

---

## 2. Custom Business Dashboard (Next.js)

For the business owner/client. Access at `/admin/`.

### Dashboard Home (`/admin/`) ✅
- Stats cards: Total Orders, Revenue, Active Products, Pending Refunds ✅
- Recent orders list (last 10) ✅
- Low stock alerts ✅
- Sales chart (last 7 days) 🚧

### Orders Management (`/admin/orders`) ✅
- Filterable table: status, date range, payment status ✅
- Click to view order detail ✅
- Update order status (pending → confirmed → packed → shipped → delivered) ✅
- Cancel order (with reason input) ✅
- Process refund (partial or full) 🚧
- Add tracking number and provider 🚧

### Products Management (`/admin/products`) ✅
- Table of all products with stock, price, status ✅
- Quick edit: price, stock, active toggle ✅
- CSV Export button ✅
- Add new product form 🚧
- Bulk upload button 🚧

### Inventory (`/admin/inventory`) ✅
- Stock view: product, in stock/out of stock counts ✅
- Out of stock alerts ✅
- CSV Export ✅

### Coupons (`/admin/coupons`) ✅
- Create new coupon (code, type, value, min cart, max discount, usage limit) ✅
- List all coupons with usage count 🚧
- Toggle active/inactive 🚧

### Reviews (`/admin/reviews`) ✅
- Pending approval tab ✅
- Approve / reject reviews ✅
- Delete inappropriate reviews ✅

### Refunds (`/admin/refunds`) ✅
- Pending refund requests ✅ (list view)
- Process refund ✅ — `POST /api/admin/refunds/{id}/status/` (approved/rejected/processed); approving attempts the Razorpay refund, marks the order refunded, and reverses any loyalty points earned on it
- View refund history ✅

### Delivery (`/admin/delivery`) 🚧
- Manage pincodes 🚧
- Bulk upload pincode CSV 🚧
- Set delivery days per pincode 🚧

### Reports (`/admin/reports`) ✅ (basic)
- Sales report (date range picker) 🚧
- Top selling products 🚧
- Revenue by category 🚧
- Orders by delivery type 🚧

---

## 3. Access Levels

| Role | Django Admin | Custom Dashboard |
|---|---|---|
| Superadmin | Full access | Full access |
| Staff (internal) | Product, Order, Review access | — |
| Business Owner | — | Orders, Products, Inventory, Coupons, Reports |
| Customer Support | — | Orders (view + status update), Refunds |
