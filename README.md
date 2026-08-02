# BestChoice E-Commerce

Full-stack e-commerce platform for clothing & cosmetics serving Tamilnadu with home delivery and store pickup.

**Stack:** Django + DRF + PostgreSQL | Next.js + TailwindCSS + React Query + Zustand | AWS S3 + CloudFront | Razorpay

## Quick Start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

createdb bestchoice_db
cp .env.example .env

python manage.py migrate
python manage.py seed_categories
python manage.py seed_pincodes
python manage.py createsuperuser

python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 — backend at http://localhost:8000

## Environment Variables

### Backend (`.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | Yes | — | Django secret key |
| `DJANGO_DEBUG` | No | `True` | Debug mode |
| `DB_NAME` | Yes | `bestchoice_db` | PostgreSQL database |
| `DB_USER` | Yes | `bestchoice` | Database user |
| `DB_PASSWORD` | Yes | — | Database password |
| `RAZORPAY_KEY_ID` | Yes | — | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Yes | — | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | No | — | Razorpay webhook secret |
| `AWS_ACCESS_KEY_ID` | No | — | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | No | — | S3 secret key |
| `AWS_STORAGE_BUCKET_NAME` | No | — | S3 bucket name |
| `AWS_CLOUDFRONT_DOMAIN` | No | — | CloudFront URL |
| `EMAIL_HOST` | No | — | SMTP server |
| `EMAIL_HOST_USER` | No | — | SMTP user |
| `EMAIL_HOST_PASSWORD` | No | — | SMTP password |
| `DEFAULT_FROM_EMAIL` | No | `noreply@bestchoice.in` | From address |

### Frontend (`.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000/api` | Backend API base URL |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | — | Razorpay key (from dashboard) |

## Pages

| Route | Type | Description |
|---|---|---|
| `/` | Home | Hero banner, categories, featured products |
| `/products` | Listing | Filterable product grid with search, sort, mobile filters drawer |
| `/products/[slug]` | Detail | Gallery with lightbox zoom, variants, pricing, pincode checker, reviews (write + read), sticky bottom bar on mobile, related products, share via Web Share API |
| `/cart` | Cart | Items, quantity controls, coupon input, summary |
| `/checkout` | Checkout | Address form, delivery type, loyalty points redemption, Razorpay payment |
| `/auth/login` | Login | Email/password login |
| `/auth/register` | Register | New user registration (supports referral codes) |
| `/account` | Dashboard | Order history, wishlist, loyalty points |
| `/account/orders` | Orders | Order list |
| `/account/orders/[id]` | Order detail | Status timeline, items, tracking, cancel/refund |
| `/account/wishlist` | Wishlist | Saved products |
| `/account/loyalty` | Loyalty | Points balance & history |
| `/admin` | Dashboard | Business stats, recent orders, low stock |
| `/admin/orders` | Admin | Order management with full status flow (confirm→pack→ship→deliver) |
| `/admin/products` | Admin | Product table with inline editing + CSV export |
| `/admin/inventory` | Admin | Stock tracking with CSV export |
| `/admin/coupons` | Admin | Coupon creation form |
| `/admin/reviews` | Admin | Review approval |
| `/admin/refunds` | Admin | Refund processing |
| `/admin/reports` | Admin | Sales reports |

## API Endpoints

Base: `http://localhost:8000/api/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register/` | — | Register new user (accepts `referral_code`) |
| POST | `/auth/login/` | — | Login, get JWT tokens |
| POST | `/auth/token/refresh/` | — | Refresh JWT |
| GET/PUT | `/auth/me/` | Bearer | Current user profile |
| GET | `/products/` | — | Product listing with filters (search, price range, discount, color, size) |
| GET | `/products/{slug}/` | — | Product detail with related products |
| GET | `/categories/` | — | Category tree |
| GET | `/brands/` | — | Brand listing |
| GET | `/cart/` | Bearer/* | Get cart |
| POST | `/cart/items/` | Bearer/* | Add to cart |
| POST | `/cart/apply-coupon/` | Bearer/* | Apply coupon code |
| POST | `/checkout/` | Bearer | Create order + Razorpay order (accepts `loyalty_points_used`) |
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
| POST | `/admin/orders/{id}/status/` | Bearer | Admin: update order status |
| PUT | `/admin/products/{id}/` | Bearer | Admin: update product |
| GET | `/api/health/` | — | Health check endpoint |

* = session-based cart works without auth for guest users

## Payment Flow (Razorpay)

1. User fills address → optionally redeems loyalty points → clicks Pay
2. Frontend POSTs to `/checkout/` (includes `loyalty_points_used`) → backend calculates delivery charge, creates Order + Razorpay order
3. Backend returns `razorpay_order_id` + `key_id`
4. Frontend loads checkout.razorpay.com → opens Razorpay modal
5. User pays via UPI / card / netbanking / wallet
6. Razorpay calls handler with `payment_id` + `signature`
7. Frontend POSTs to `/payment/verify/` → backend verifies signature, deducts loyalty points if used
8. On success: order → confirmed, notification email sent, loyalty points credited
9. On cancel: auto-refund via Razorpay API + stock restored + loyalty points reversed

## Key Features

- **JWT Auth** — email/password login, 24h access tokens, 30d refresh, referral code on register
- **Product Variants** — color + size combos with per-variant stock and SKU
- **Image Pipeline** — automatic on upload: original compressed (capped 2000x2000, JPEG q90), thumb/small/medium/large WebP variants generated (150/400/800/1200px, q80, mobile-bandwidth-friendly), stored to S3/CloudFront or local storage transparently
- **Related Products** — auto-suggested same-category products, plus manually curated via RelatedProduct model
- **Delivery** — 388 Tamilnadu pincodes, same-day Chennai, weight-based charge, free over ₹500
- **Pincode Checker** — real-time delivery check on product detail page
- **Coupons** — percentage or fixed discount, min cart, per-user limits, max discount cap
- **Loyalty** — 1 pt per ₹100 spent, redeem at checkout (1 pt = ₹1), points expire 365 days after earning (FIFO redemption, `expire_loyalty_points` cron command), referral bonuses (50 pts each), birthday bonus command
- **Order Tracking** — automatic status history logging, timeline UI in order detail
- **Notifications** — order confirmation email with HTML template (console backend in dev, SMTP in prod)
- **Reviews** — write with star rating + text, read with average rating + distribution
- **Admin Dashboard** — order status flow, inline product editing, CSV export, coupon creation, review moderation
- **Gallery** — clickable zoom, lightbox with prev/next navigation
- **Share** — Web Share API with clipboard fallback
- **Sticky Bottom Bar** — mobile add-to-cart with quantity selector

## Management Commands

| Command | Description |
|---|---|
| `seed_categories` | Seed the 5-category, 38-node hierarchy (idempotent) |
| `seed_pincodes` | Import Tamilnadu pincodes from government CSV |
| `process_images` | Optional backfill/reprocess of existing images (new uploads process automatically) |
| `give_birthday_bonus` | Award 100 loyalty points to users with birthday today |

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

| Document | Description |
|---|---|
| `docs/ARCHITECTURE.md` | System architecture, data flow, design decisions |
| `docs/DEPLOYMENT.md` | Production deployment guide |
| `docs/API-SPECS.md` | Full API reference with request/response examples |
| `docs/ADMIN.md` | Django admin + custom dashboard guide |
| `docs/PRODUCT-PAGE.md` | Product detail page spec |
| `docs/DELIVERY.md` | Tamilnadu delivery & logistics |
| `docs/LOYALTY.md` | Loyalty points system |
| `docs/COUPONS.md` | Coupon codes system |
| `docs/INVENTORY-SETUP.md` | Inventory flow & SKU format |
| `docs/WHATSAPP.md` | WhatsApp integration |
| `AGENTS.md` | Agent session memory & rules |
| `PLAN.md` | Master plan & schema |
