# Admin Panels

## 1. Django Admin (Developers)

Used for full backend management. Access at `/django-admin/`.

### Registered Models
- Users (view, edit, deactivate, reset password)
- Categories (CRUD, reorder, manage tree)
- Brands (CRUD, logo upload)
- Products (CRUD, bulk upload, duplicate)
- Product Variants (inline on product)
- Product Images (inline on product, sortable)
- Orders (view, update status, manual refund)
- Coupons (CRUD, usage tracking)
- Reviews (approve/reject)
- Refunds (process)
- Delivery Pincodes (manage)

### Custom Admin Actions
- **Duplicate Product** — copies product + all variants + images + highlights
- **Export Products** — CSV of all products
- **Bulk Upload** — upload Excel/CSV to create/update products
- **Mark Orders Shipped** — bulk action with tracking number input

---

## 2. Custom Business Dashboard (Next.js)

For the business owner/client. Access at `/admin/`.

### Dashboard Home (`/admin/`)
- Stats cards: Total Orders (today/week/month), Revenue, Active Products, Pending Refunds
- Recent orders list (last 10)
- Low stock alerts
- Sales chart (last 7 days)

### Orders Management (`/admin/orders`)
- Filterable table: status, date range, payment status
- Click to view order detail
- Update order status (pending → confirmed → packed → shipped → delivered)
- Cancel order (with reason input)
- Process refund (partial or full)
- Add tracking number and provider

### Products Management (`/admin/products`)
- Table of all products with stock, price, status
- Quick edit: price, stock, active toggle
- Add new product form
- Bulk upload button

### Inventory (`/admin/inventory`)
- Stock view: product, variant, SKU, current stock
- Low stock filter (≤5 items)
- Export inventory report

### Coupons (`/admin/coupons`)
- Create new coupon: code, type (percent/fixed), value, min cart, max discount, valid dates, usage limit
- List all coupons with usage count
- Toggle active/inactive

### Reviews (`/admin/reviews`)
- Pending approval tab
- Approve / reject reviews
- Delete inappropriate reviews

### Refunds (`/admin/refunds`)
- Pending refund requests
- Process refund (via Razorpay API)
- View refund history

### Delivery (`/admin/delivery`)
- Manage pincodes
- Bulk upload pincode CSV
- Set delivery days per pincode

### Reports (`/admin/reports`)
- Sales report (date range picker)
- Top selling products
- Revenue by category
- Orders by delivery type

---

## 3. Access Levels

| Role | Django Admin | Custom Dashboard |
|---|---|---|
| Superadmin | Full access | Full access |
| Staff (internal) | Product, Order, Review access | — |
| Business Owner | — | Orders, Products, Inventory, Coupons, Reports |
| Customer Support | — | Orders (view + status update), Refunds |
