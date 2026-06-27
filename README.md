# BestChoice E-Commerce

Full-stack e-commerce platform for clothing & cosmetics serving Tamilnadu with home delivery and store pickup.

**Stack:** Django + DRF + PostgreSQL | Next.js + TailwindCSS + React Query + Zustand | AWS S3 + CloudFront | Razorpay

## Quick Start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Create PostgreSQL database
createdb bestchoice_db

# Copy and edit env vars
cp .env.example .env

# Run migrations and seed data
python manage.py migrate
python manage.py seed_categories
python manage.py seed_pincodes
python manage.py createsuperuser

# Start dev server
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install

# Copy env vars
cp .env.example .env.local

# Start dev server
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
| `AWS_ACCESS_KEY_ID` | No | — | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | No | — | S3 secret key |
| `AWS_STORAGE_BUCKET_NAME` | No | — | S3 bucket name |
| `AWS_CLOUDFRONT_DOMAIN` | No | — | CloudFront URL |

### Frontend (`.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000/api` | Backend API base URL |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | — | Razorpay key (from dashboard) |

## Project Structure

```
bestchoice/
├── backend/                     # Django project
│   ├── config/                  # Settings, URLs, WSGI
│   ├── accounts/                # User model + JWT auth
│   ├── products/                # Categories, brands, products, variants
│   ├── cart/                    # Cart + cart items
│   ├── orders/                  # Orders, checkout, payments, refunds
│   ├── coupons/                 # Coupon codes
│   ├── reviews/                 # Product reviews
│   ├── wishlist/                # User wishlist
│   ├── loyalty/                 # Loyalty points system
│   └── delivery/                # Pincode delivery check
├── frontend/                    # Next.js project
│   ├── src/app/                 # App router pages
│   │   ├── products/            # Listing + detail
│   │   ├── cart/                # Shopping cart
│   │   ├── checkout/            # Checkout + Razorpay payment
│   │   ├── account/             # Orders, wishlist, loyalty
│   │   ├── auth/                # Login / register
│   │   └── admin/               # Business dashboard
│   ├── src/components/          # Reusable UI components
│   ├── src/lib/                 # API client, utilities
│   └── src/store/               # Zustand state
└── docs/                        # Specifications & guides
```

## Pages

| Route | Type | Description |
|---|---|---|
| `/` | Home | Hero banner, categories, featured products |
| `/products` | Listing | Filterable product grid with search, sort, pagination |
| `/products/[slug]` | Detail | Gallery, variants, pricing, reviews, delivery check |
| `/cart` | Cart | Items, quantity controls, coupon input, summary |
| `/checkout` | Checkout | Address form, delivery type, Razorpay payment |
| `/auth/login` | Login | Email/password login |
| `/auth/register` | Register | New user registration |
| `/account` | Dashboard | Order history, wishlist, loyalty points |
| `/account/orders` | Orders | Order list |
| `/account/orders/[id]` | Order detail | Status, items, tracking, cancel/refund |
| `/account/wishlist` | Wishlist | Saved products |
| `/account/loyalty` | Loyalty | Points balance & history |
| `/admin` | Dashboard | Business stats, recent orders, low stock |
| `/admin/orders` | Admin | Order management |
| `/admin/products` | Admin | Product management |
| `/admin/inventory` | Admin | Stock tracking |
| `/admin/coupons` | Admin | Coupon management |
| `/admin/reviews` | Admin | Review approval |
| `/admin/refunds` | Admin | Refund processing |
| `/admin/reports` | Admin | Sales reports |

## API Endpoints

Base: `http://localhost:8000/api/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register/` | — | Register new user |
| POST | `/auth/login/` | — | Login, get JWT tokens |
| POST | `/auth/token/refresh/` | — | Refresh JWT |
| GET | `/auth/me/` | Bearer | Current user profile |
| GET | `/products/` | — | Product listing with filters |
| GET | `/products/{slug}/` | — | Product detail |
| GET | `/categories/` | — | Category tree |
| GET | `/cart/` | Bearer/* | Get cart |
| POST | `/cart/items/` | Bearer/* | Add to cart |
| POST | `/cart/apply-coupon/` | Bearer/* | Apply coupon code |
| POST | `/checkout/` | Bearer | Create order + Razorpay order |
| POST | `/payment/verify/` | Bearer | Verify Razorpay payment |
| GET | `/orders/` | Bearer | User orders list |
| GET | `/orders/{id}/` | Bearer | Order detail |
| POST | `/orders/{id}/cancel/` | Bearer | Cancel order |
| POST | `/orders/{id}/refund/` | Bearer | Request refund |
| GET | `/products/{slug}/reviews/` | — | Product reviews |
| POST | `/products/{slug}/reviews/` | Bearer | Write review |
| GET | `/wishlist/` | Bearer | List wishlist |
| POST | `/wishlist/` | Bearer | Add to wishlist |
| GET | `/loyalty/balance/` | Bearer | Points balance |
| GET | `/loyalty/transactions/` | Bearer | Points history |
| GET | `/delivery/check/{pincode}/` | — | Check delivery availability |

* = session-based cart works without auth for guest users

## Payment Flow (Razorpay)

1. User fills address → clicks Pay
2. Frontend POSTs to `/checkout/` → backend creates Order + Razorpay order
3. Backend returns `razorpay_order_id` + `key_id`
4. Frontend loads `checkout.razorpay.com/v1/checkout.js` → opens Razorpay modal
5. User pays via UPI / card / netbanking / wallet
6. Razorpay calls `handler` callback with `payment_id` + `signature`
7. Frontend POSTs to `/payment/verify/` → backend verifies signature
8. On success: order → `confirmed`, payment → `paid`, loyalty points credited
9. On cancel: auto-refund via Razorpay API + stock restored + loyalty reversed

## Key Features

- **JWT Auth** — email/password login, 24h access tokens, 30d refresh
- **Product Variants** — color + size combos with per-variant stock and SKU
- **Image Pipeline** — 4 sizes (thumb/small/medium/large) on S3 via CloudFront CDN
- **Delivery** — 388 Tamilnadu pincodes, same-day Chennai, standard 2-3 days, store pickup
- **Coupons** — percentage or fixed discount, min cart, per-user limits, max discount cap
- **Loyalty** — 5 pts per ₹100 spent, earn on payment, reverse on cancel
- **Orders** — status flow: pending → confirmed → packed → shipped → delivered
- **Refunds** — automatic Razorpay refund on cancellation
- **Admin Dashboard** — custom business dashboard with orders, inventory, coupons, reports

## Category Hierarchy

```
Men's Wear → Shirts, T-Shirts, Jeans, Trousers, Blazers, Ethnic Wear
Women's Wear → Sarees, Kurtis, Dresses, Tops
Kids Wear
Cosmetics
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

## Build Phases

| Phase | What | Status |
|---|---|---|
| 1 | Django + DRF + PostgreSQL setup | ✅ Done |
| 2 | Core models: User, Category, Product, Variant | ✅ Done |
| 3 | DRF API endpoints | ✅ Done |
| 4 | Next.js frontend scaffolding | ✅ Done |
| 5 | Product listing + detail page | ✅ Done |
| 6 | Cart, checkout, Razorpay | ✅ Done |
| 7 | Orders, tracking, refunds, loyalty | ✅ Done |
| 8 | Reviews, wishlist, coupons | ✅ Done |
| 9 | Admin dashboard (custom) | ✅ Done |
| 10 | Delivery, polish, deploy prep | ✅ Done |

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
