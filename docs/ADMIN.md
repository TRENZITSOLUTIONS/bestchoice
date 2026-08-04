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

## 2. Staff Dashboard (Next.js) — at `/staff`

For the shop owner and staff. Sign in at `/staff/login` with an email and password;
the layout checks `is_staff` and every API route enforces it again server-side.

Note the path: the dashboard is at **`/staff`**, not `/admin/`. `/admin/` is Django Admin.

| Screen | What it does |
|---|---|
| `/staff` | Revenue and paid-order totals, work-waiting counts, a 7/30/90-day revenue chart, recent orders, orders by status. Banners link straight to pending refunds and reviews. |
| `/staff/orders` | Every customer's orders, filterable by status, payment and free-text search across order id, email and phone. Advance status one step, or multi-select and bulk mark shipped with a courier name. |
| `/staff/inventory` | Stock worst-first with out/low/ok flags. Inline price editing; stock editing only on products without variants, where the field is authoritative. |
| `/staff/refunds` | Requested refunds with a two-step confirmation — approving moves real money through Razorpay, reverses loyalty points and marks the order refunded. |
| `/staff/reviews` | Moderation queue. Publish or unpublish. Only fills up when `auto_approve_reviews` is off (Django Admin → Review config). |
| `/staff/coupons` | Create coupons, see usage counts against limits, deactivate and reactivate. |
| `/staff/delivery` | Pincode lookup. Adding and bulk-importing still happens in Django Admin or via `import_pincodes`. |
| `/staff/reports` | Top sellers, revenue by category, home delivery vs store pickup, over 7/30/90/365 days. |

Revenue figures count **paid, non-cancelled** orders only.

### API

Everything above is served by `/api/admin/*`, all `IsAdminUser`:

| Endpoint | Does |
|---|---|
| `GET /stats/?days=` | Dashboard headline numbers plus a zero-filled daily revenue series |
| `GET /reports/?days=` | Top products, revenue by category, delivery-type split |
| `GET /orders/` | All orders — `status`, `payment_status`, `delivery_type`, `search`, `page` |
| `POST /orders/bulk-ship/` | Mark many shipped. Rejects one `tracking_id` across several orders |
| `POST /orders/{order_id}/status/` | Advance a single order, logging status history |
| `GET /refunds/` · `POST /refunds/{id}/status/` | Refund queue and approve/reject/process |
| `GET /inventory/?low_stock_below=` | Stock with out/low/ok state |
| `PUT/PATCH /products/{pk}/` | Update pricing, stock, visibility, category, brand |
| `GET /reviews/?pending=true` · `POST /reviews/{id}/moderate/` | Queue and approve/reject |
| `GET/POST /coupons/` · `PATCH/DELETE /coupons/{pk}/` | Coupon CRUD. DELETE deactivates rather than deleting, so usage history survives |
| `GET /pincodes/?search=` | Delivery pincode lookup |

### Still only in Django Admin

- Creating products, variants and images (the dashboard reads and edits, it doesn't create)
- Bulk product CSV upload and the duplicate-product action
- Adding or bulk-importing delivery pincodes
- Outside-Tamil-Nadu delivery rates, loyalty config, review config

### Not built

- CSV export from the dashboard
- Low-stock alerting — there is no `reorder_level` field and no notification anywhere; the dashboard flags low stock on screen but nothing emails you

---

## 3. Access Levels

There is **one** permission distinction in the system: `is_staff`. No role model, no
per-area scoping.

| | Django Admin (`/admin/`) | Dashboard (`/staff`) | `/api/admin/*` |
|---|---|---|---|
| Superuser | Full access | Yes | Yes |
| `is_staff` user | Per Django model permissions | Yes | Yes |
| Customer | No | No — shown an explanation | **No** — 403 |
| Anonymous | No | Prompted to sign in | **No** — 401 |

Customers authenticate with Google and never have a usable password, so they cannot
reach `/staff/login` at all. Staff accounts are created with `createsuperuser`, or by
setting `is_staff` on an existing user in Django Admin.

There is no finer-grained split — an `is_staff` user can do everything in the
dashboard. Separate Business Owner and Customer Support scopes would need a role
model and per-endpoint permission classes.
