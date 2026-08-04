# BestChoice E-Commerce

Online store for BestChoice Clothing (Spencer Plaza, Chennai) — clothing, cosmetics, and mobile accessories, with home delivery across Tamil Nadu and store pickup.

**Stack:** Django 4.2 + DRF + PostgreSQL 15 · Next.js 16 + Tailwind + React Query + Zustand · S3 + CloudFront · Razorpay

📖 **[Full documentation →](docs/README.md)**

## Quick Start

Whole stack in Docker — needs a `.env` first (see [ENVIRONMENT.md](docs/ENVIRONMENT.md)):

```bash
cp .env.example .env && docker compose up -d --build
```

Or run the two services directly for hot reload:

```bash
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

```bash
createdb bestchoice_db && cp .env.example .env
```

```bash
python manage.py migrate && python manage.py seed_categories && python manage.py seed_pincodes && python manage.py createsuperuser && python manage.py runserver
```

```bash
cd frontend && npm install && cp .env.example .env.local && npm run dev
```

Storefront at http://localhost:3000, API at http://localhost:8000/api/, Django Admin at http://localhost:8000/admin/.

Customers sign in with Google, so `/auth/login` needs `GOOGLE_OAUTH_CLIENT_ID` (backend) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend) set to the same client ID. Without them the sign-in button shows a "not configured" notice. Full walkthrough in [SETUP.md](docs/SETUP.md).

## Environment Variables

Every variable — what it does, whether it's required, where to get a real value, and the build-time vs runtime distinction — is in **[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)**.

Templates to copy: [`.env.example`](.env.example) for Docker, [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for local dev.

## Pages

| Route | Type | Description |
|---|---|---|
| `/` | Home | Hero banner, categories, featured products |
| `/products` | Listing | Filterable product grid with search, sort, category-aware filter sidebar |
| `/products/[slug]` | Detail | Image gallery with thumbnails, variant selection, pricing, pincode delivery check, reviews (write + read), related products |
| `/cart` | Cart | Items, quantity controls, working coupon input, summary |
| `/checkout` | Checkout | Address form, delivery type, loyalty points redemption, Razorpay payment |
| `/auth/login` | Sign in | Google sign-in only (supports referral codes) |
| `/staff/login` | Staff sign in | Email/password, staff accounts only — not linked from the storefront |
| `/account` | Dashboard | Order history, wishlist, loyalty points |
| `/account/orders` | Orders | Order list |
| `/account/orders/[id]` | Order detail | Status timeline, items, tracking, cancel/refund |
| `/account/wishlist` | Wishlist | Saved products |
| `/account/loyalty` | Loyalty | Points balance & history |
| `/privacy` `/terms` `/refund-policy` `/shipping-policy` | Legal | Policy pages (unreviewed drafts — see the notice on each) |

### Staff dashboard

Staff-only, behind an `is_staff` check. Sign in at `/staff/login`.

| Route | Description |
|---|---|
| `/staff` | Revenue & order stats, revenue chart, recent orders, orders by status |
| `/staff/orders` | All orders: filter, search, advance status, bulk mark shipped |
| `/staff/inventory` | Stock worst-first with out/low/ok flags, inline price editing |
| `/staff/refunds` | Approve, reject or process refund requests |
| `/staff/reviews` | Moderation queue — publish / unpublish |
| `/staff/coupons` | Create coupons, see usage, deactivate |
| `/staff/delivery` | Delivery pincode lookup |
| `/staff/reports` | Top sellers, revenue by category, delivery-type split |

Product creation, bulk CSV upload and pincode imports remain in Django Admin at
`http://localhost:8000/admin/`. See [docs/ADMIN.md](docs/ADMIN.md).

## API Endpoints

Base: `http://localhost:8000/api/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/google/` | — | Customer sign-in via Google ID token (accepts `referral_code`) |
| POST | `/auth/staff/login/` | — | Staff-only email/password login, get JWT tokens |
| POST | `/auth/token/refresh/` | — | Refresh JWT |
| GET/PUT | `/auth/me/` | Bearer | Current user profile |
| GET | `/products/` | — | Product listing with filters (search, price range, discount, color, size) |
| GET | `/products/{slug}/` | — | Product detail with related products |
| GET | `/categories/` | — | Category tree |
| GET | `/brands/` | — | Brand listing |
| GET | `/cart/` | Bearer/* | Get cart |
| POST | `/cart/items/` | Bearer/* | Add to cart |
| POST | `/cart/apply-coupon/` | Bearer/* | Apply a coupon to the cart (persisted; returns the discounted cart) |
| DELETE | `/cart/remove-coupon/` | Bearer/* | Clear the applied coupon |
| POST | `/checkout/` | Bearer | Create order + Razorpay order (applies the cart's coupon and `loyalty_points_used`) |
| POST | `/payment/verify/` | Bearer | Verify Razorpay payment |
| POST | `/payment/webhook/` | — | Razorpay webhook (signature verified) |
| GET | `/orders/` | Bearer | User orders list |
| GET | `/orders/{id}/` | Bearer | Order detail with tracking info |
| GET | `/orders/{id}/track/` | Bearer | Order status history timeline |
| POST | `/orders/{id}/cancel/` | Bearer | Cancel order (auto-refund + stock restore) |
| POST | `/orders/{id}/refund/` | Bearer | Request refund |
| GET/POST | `/products/{slug}/reviews/` | * | Product reviews (write requires auth) |
| GET | `/reviews/mine/` | Bearer | My reviews |
| GET/POST | `/wishlist/` | Bearer | List/add to wishlist |
| DELETE | `/wishlist/{id}/` | Bearer | Remove from wishlist |
| GET | `/loyalty/balance/` | Bearer | Points balance |
| GET | `/loyalty/transactions/` | Bearer | Points history |
| GET | `/delivery/check/{pincode}/` | — | Check delivery availability with charge |
| GET | `/admin/stats/` | Staff | Dashboard headline numbers + daily revenue series |
| GET | `/admin/reports/` | Staff | Top sellers, revenue by category, delivery-type split |
| GET | `/admin/orders/` | Staff | All orders, filterable + searchable |
| POST | `/admin/orders/bulk-ship/` | Staff | Bulk mark shipped with courier details |
| POST | `/admin/orders/{id}/status/` | Staff | Update order status |
| GET | `/admin/refunds/` | Staff | Refund queue |
| POST | `/admin/refunds/{id}/status/` | Staff | Approve/reject/process a refund (reverses loyalty points) |
| GET | `/admin/inventory/` | Staff | Stock with out/low/ok flags |
| PUT/PATCH | `/admin/products/{id}/` | Staff | Update product pricing, stock, visibility |
| GET | `/admin/reviews/` | Staff | Review moderation queue |
| POST | `/admin/reviews/{id}/moderate/` | Staff | Approve or reject a review |
| GET/POST | `/admin/coupons/` | Staff | List or create coupons |
| PATCH/DELETE | `/admin/coupons/{id}/` | Staff | Update; DELETE deactivates so usage history survives |
| GET | `/admin/pincodes/` | Staff | Delivery pincode lookup |
| GET | `/health/` | — | Health check |

* = session-based cart works without auth for guest users

## Payment Flow (Razorpay)

1. User fills address → optionally redeems loyalty points → clicks Pay
2. Frontend POSTs to `/checkout/` → backend validates stock, prices the coupon and points, quotes delivery, reserves a Razorpay order, then writes the Order, items, stock deduction and coupon usage in one transaction
3. Backend returns `razorpay_order_id` + `razorpay_key_id` + `amount_in_paise`
4. Frontend loads checkout.razorpay.com → opens Razorpay modal
5. User pays via UPI / card / netbanking / wallet
6. Razorpay calls handler with `payment_id` + `signature`
7. Frontend POSTs to `/payment/verify/` → backend verifies signature, deducts loyalty points if used
8. On success: order → confirmed, notification email sent, loyalty points credited
9. On cancel: auto-refund via Razorpay API + stock restored + loyalty points reversed + coupon use released

If the gateway is unreachable at step 2, nothing is written — no order, no stock deducted, no coupon consumed.

## Key Features

- **Auth** — customers sign in with Google only (ID token verified server-side); staff use email/password at a separate `/staff/login`. JWT: 24h access, 30d refresh. Referral codes apply on first Google sign-in
- **Product Variants** — color + size combos with per-variant stock and SKU
- **Image Pipeline** — automatic on upload: original compressed (capped 2000x2000, JPEG q90), thumb/small/medium/large WebP variants generated (150/400/800/1200px, q80, mobile-bandwidth-friendly), stored to S3/CloudFront or local storage transparently
- **Related Products** — auto-suggested same-category products, plus manually curated via RelatedProduct model
- **Delivery** — 388 Tamilnadu pincodes on two price zones (local Chennai ₹30, standard ₹80), weight surcharge over 1kg, free over ₹500, plus a configurable outside-Tamil-Nadu rate card. Same-day delivery is not offered; every Tamil Nadu pincode quotes 2-4 business days
- **Pincode Checker** — real-time delivery check on product detail page
- **Coupons** — percentage or fixed discount, min cart, per-user limits, max discount cap. Stored on the cart, revalidated on every read and again at checkout; usage is consumed at order time and released on cancellation
- **Loyalty** — 1 pt per ₹100 spent, redeem at checkout (1 pt = ₹1), points expire 365 days after earning (FIFO redemption, `expire_loyalty_points` cron command), referral bonuses (50 pts each), birthday bonus command
- **Order Tracking** — automatic status history logging, timeline UI in order detail
- **Notifications** — order confirmation email with HTML template (console backend in dev, SMTP in prod)
- **Reviews** — write with star rating + text, read with average rating + distribution. Note: new reviews are auto-approved, so the `is_approved` moderation flag doesn't currently hold anything back
- **Store management** — Django Admin: model CRUD, bulk product upload via CSV, duplicate-product action, and a configurable `LoyaltyConfig` singleton for every rewards rate

## Management Commands

| Command | Description |
|---|---|
| `seed_categories` | Seed the 5-category, 38-node hierarchy (idempotent) |
| `seed_pincodes` | Import Tamilnadu pincodes from government CSV |
| `import_pincodes <csv>` | Import pincodes from your own CSV (`--sample` writes a template, `--clear` replaces) |
| `process_images` | Optional backfill/reprocess of existing images (new uploads process automatically) |
| `give_birthday_bonus` | Award birthday points (amount from `LoyaltyConfig`, default 100) — run daily |
| `expire_loyalty_points` | Expire points past their 365-day window — run daily |

The last two are the only ones that need a schedule; nothing sets that up for you. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#scheduled-maintenance-commands).

## Category Hierarchy

```
Men's Wear → Shirts, T-Shirts, Jeans, Trousers, Cargo Pants, Hoodies, Shorts, Blazers, Ethnic Wear, Others
Women's Wear → Sarees, Kurtis, Tops, Dresses, Leggings, Night Wear, Others
Kids' Wear → Boys Wear, Girls Wear, Baby Wear, Others
Cosmetics → Makeup, Skincare, Hair Care, Perfumes, Others
Mobile Accessories → Chargers, Cases & Covers, Earphones, Neckbands, Smart Watches, Tempered Glass, Others
```

## SKU Format

```
BC-{category_code}-{product_id}-{COLOR}-{SIZE}
  │       │             │          │       └── Size (S/M/L/XL)
  │       │             │          └────────── Color (RED/BLUE/BLK)
  │       │             └───────────────────── Auto-increment ID (000001)
  │       └─────────────────────────────────── Category code (SHT/TSH/JNS)
  └─────────────────────────────────────────── BestChoice prefix
```

Example: `BC-SHT-000001-RED-M`

## Docs

**Start at [docs/README.md](docs/README.md)** — it maps everything below and suggests a reading order.

| Document | Description |
|---|---|
| [docs/README.md](docs/README.md) | Documentation index and current project state |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Every environment variable, what breaks without it, where to get values |
| [docs/SETUP.md](docs/SETUP.md) | Local development setup |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment, backups, troubleshooting |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, design decisions |
| [docs/API-SPECS.md](docs/API-SPECS.md) | Full API reference with request/response examples |
| [docs/ADMIN.md](docs/ADMIN.md) | Django Admin guide |
| [docs/INVENTORY-SETUP.md](docs/INVENTORY-SETUP.md) | Inventory flow & SKU format |
| [docs/PRODUCT-PAGE.md](docs/PRODUCT-PAGE.md) | Product detail page spec |
| [docs/DELIVERY.md](docs/DELIVERY.md) | Tamilnadu delivery & logistics |
| [docs/LOYALTY.md](docs/LOYALTY.md) | Loyalty points system |
| [docs/COUPONS.md](docs/COUPONS.md) | Coupon codes system |
| [docs/WHATSAPP.md](docs/WHATSAPP.md) | WhatsApp support link |
| [AGENTS.md](AGENTS.md) | Agent session memory & rules |
| [PLAN.md](PLAN.md) | Master plan & schema |
