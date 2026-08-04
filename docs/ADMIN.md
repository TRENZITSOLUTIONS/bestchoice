# Admin Panels

> **Implementation Status**: ✅ = Built · 🚧 = Page exists but features incomplete · 🚫 = Not built

## 1. Django Admin (Developers)

Used for full backend management. Access at `/admin/`.

### Registered Models ✅
- Users (view, edit, deactivate, reset password)
- Categories (CRUD; order via a `sort_order` integer field, not drag-and-drop)
- Brands (CRUD, logo upload)
- Products (CRUD)
- Product Variants (inline on product)
- Product Images (inline on product; `sort_order` integer field)
- Orders (view, update status)
- Coupons (CRUD, usage tracking)
- Reviews (an `approve_reviews` bulk action — but reviews are already auto-approved on creation, so it is a no-op in practice. There is no reject action)
- Refunds (process)
- Delivery Pincodes (manage)
- Loyalty Config (singleton — every rewards rate, bonus, and cap is editable here)

### Custom Admin Actions
- **Duplicate Product** — copies product + all variants + images + highlights, as an inactive draft ✅ (does *not* copy `RelatedProduct` links)
- **Bulk Upload** — "Upload CSV" button on the product changelist creates base products from a CSV (variants added afterward) ✅
- **Mark Orders Shipped** — bulk action with tracking number input 🚧

### Image Processing ✅

Automatic — happens when a product image is uploaded (`ProductImage.save()`): the original is compressed (capped 2000x2000, JPEG q90) and thumb/small/medium/large WebP variants are generated (150/400/800/1200px, q80). No manual step needed.

```
python manage.py process_images
```
Optional maintenance/backfill command to reprocess existing images (e.g. after changing compression settings) — not part of the normal upload flow.

---

## 2. Custom Business Dashboard (Next.js) — 🚧 NOT BUILT

**There is no custom admin dashboard.** The storefront serves 12 pages, none of them
under `/admin/`, and `/admin/` on the deployed site routes to Django Admin. Everything
in this section is a plan, not a description of working software.

Three admin REST endpoints do exist and are staff-gated, ready for a dashboard to call:

| Endpoint | Does |
|---|---|
| `POST /api/admin/orders/{order_id}/status/` | Move an order through pending → confirmed → packed → shipped → delivered |
| `POST /api/admin/refunds/{refund_id}/status/` | approved / rejected / processed. Approving attempts the Razorpay refund, marks the order refunded, and reverses loyalty points earned on it (once only) |
| `PUT/PATCH /api/admin/products/{pk}/` | Update name, slug, mrp, selling_price, total_stock, is_active, weight_g, descriptions, category, brand, hide_if_out_of_stock |

Everything below is unbuilt and needs both a frontend and, where noted, new API work:

- **Dashboard home** — stats cards, recent orders, low-stock alerts, sales chart. No aggregate/stats endpoint exists yet either.
- **Orders** — filterable table, tracking number + provider entry.
- **Products** — table with quick edit, CSV export, add-product form. (Bulk CSV *upload* already works in Django Admin.)
- **Inventory** — stock overview, out-of-stock alerts, CSV export. Note there is no `reorder_level` field and no low-stock alerting anywhere.
- **Coupons** — list with usage counts, active toggle.
- **Reviews** — approval queue. Would need a code change first: reviews are auto-approved at creation, so nothing is ever pending.
- **Refunds** — pending queue and history views over the endpoint above.
- **Delivery** — pincode management UI, CSV upload, per-pincode delivery days.
- **Reports** — sales by date range, top sellers, revenue by category, orders by delivery type. All need new aggregate endpoints.

---

## 3. Access Levels

There is **one** permission distinction in the system: `is_staff`. No role model, no
per-area scoping.

| | Django Admin (`/admin/`) | `/api/admin/*` endpoints | `/staff/login` |
|---|---|---|---|
| Superuser | Full access | Yes | Yes |
| `is_staff` user | Per Django model permissions | Yes | Yes |
| Customer | No | **No** — 403 | No — 403 |

Customers authenticate with Google and never have a usable password, so they cannot
reach `/staff/login` at all. Staff accounts are created with `createsuperuser`, or by
setting `is_staff` on an existing user in Django Admin.

The three roles this section previously described (Business Owner, Customer Support,
with distinct scopes) do not exist. Adding them means a role model and per-endpoint
permission classes.
