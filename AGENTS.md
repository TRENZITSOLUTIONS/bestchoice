# BestChoice E-Commerce — Agent Memory

## Project Overview
Full-stack e-commerce platform for clothing & cosmetics. Serves Tamilnadu with home delivery + store pickup.

## Tech Stack
- **Backend:** Django 4.2 + DRF 3.16 + PostgreSQL
- **Frontend:** Next.js 16 + TailwindCSS 4 + React Query 5 + Zustand
- **Images:** AWS S3 + CloudFront CDN (4 sizes auto-generated on upload)
- **Payment:** Razorpay
- **Auth:** Simple JWT (24h access, 30d refresh)
- **Cache:** Redis (planned)
- **Admin:** Django Admin (devs) + Custom dashboard in Next.js (business)

## Key Decisions
- Cloudinary rejected (free tier too limited). Using S3 + CloudFront instead.
- Razorpay for payments (best for India/UPI).
- Next.js frontend for SSR + next/image optimizations.
- Images pre-generated at 4 sizes (thumb/small/medium/large) on upload.
- WhatsApp: separate external app (not part of this project). Will be integrated in a later phase. This project only provides order data via API for the WhatsApp app to consume.

## Project Structure
```
bestchoice/
├── README.md              # Full project overview & quick start
├── PLAN.md                # Master plan, schema, architecture
├── AGENTS.md              # This file — session memory & rules
├── docs/
│   ├── ARCHITECTURE.md    # System architecture, data flow
│   ├── DEPLOYMENT.md      # Production deployment guide
│   ├── SETUP.md           # Developer onboarding
│   ├── API-SPECS.md       # All API endpoints with examples
│   ├── ADMIN.md           # Django admin + custom dashboard
│   ├── PRODUCT-PAGE.md    # Product detail page full spec
│   ├── DELIVERY.md        # Tamilnadu delivery & logistics
│   ├── LOYALTY.md         # Loyalty points system
│   ├── WHATSAPP.md        # WhatsApp integration
│   ├── INVENTORY-SETUP.md # Inventory flow, SKU format, bulk upload
│   └── COUPONS.md         # Coupon codes system
├── backend/               # Django project (9 apps)
└── frontend/              # Next.js project (20 pages)
```

## Category Hierarchy
- Men's Wear → Shirts, T-Shirts, Jeans, Trousers, Blazers, Ethnic Wear
- Women's Wear → Sarees, Kurtis, Dresses, Tops
- Kids Wear
- Cosmetics

## SKU Format
`BC-{cat_code}-{id}-{COLOR}-{SIZE}` — e.g., `BC-SHT-000001-RED-M`

## Build Phases (All Complete)
| Phase | What | Status |
|---|---|---|
| 1 | Django setup + PostgreSQL + DRF | ✅ Done |
| 2 | Core models (User, Category, Product, Variant) | ✅ Done |
| 3 | DRF API endpoints | ✅ Done |
| 4 | Next.js frontend scaffolding | ✅ Done |
| 5 | Product listing + detail page | ✅ Done |
| 6 | Cart, checkout, Razorpay | ✅ Done |
| 7 | Orders, tracking, refunds, loyalty | ✅ Done |
| 8 | Reviews, wishlist, coupons | ✅ Done |
| 9 | Admin dashboard (custom) | ✅ Done |
| 10 | WhatsApp (separate), delivery, polish, deploy prep | ✅ Done |

## Environment Variables
### Backend (.env)
`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `CORS_ALLOWED_ORIGINS`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_CLOUDFRONT_DOMAIN`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

### Frontend (.env.local)
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`

## Payment Flow
1. Frontend POST `/checkout/` → Backend creates Razorpay order
2. Frontend opens Razorpay checkout modal
3. User pays → Razorpay calls handler with payment_id + signature
4. Frontend POST `/payment/verify/` → Backend verifies signature
5. Order → confirmed, payment → paid, loyalty points credited

## Git Commits (7 total)
```
e915512 Phase 10: Razorpay, S3/CloudFront, pincodes, coupon API
4cf7b11 Phase 9: Custom admin dashboard complete
08d544a Cleanup: remove unused imagekit, add welcome loyalty bonus
6a56e06 Phase 4: Next.js frontend scaffolding complete
7340e3b Phase 3: DRF API endpoints complete
8e84124 Phase 2: All core models complete
99e504d Phase 1: Django backend setup complete
```

## Commit Rules
- Commit frequently — after every logical unit of work
- Each commit must contain only related changes — no mixing unrelated work
- Good: "Added Product model with admin", "Built product listing API with filters"
- Bad: "Added models, APIs, frontend components, and fixed bugs"

## Next Steps for Production
1. Production security settings (SECURE_SSL_REDIRECT, etc.)
2. Gunicorn + whitenoise + sentry in requirements
3. Razorpay webhook endpoint (server-side payment fallback)
4. next.config.ts production optimizations
5. SEO metadata per page, sitemap, robots.txt
6. Custom 404 + error boundary
7. Docker + nginx + deploy script + DB backups
8. Write tests (currently zero)
9. Build documented features not yet implemented (OTP auth, image pipeline, pincode checker, etc.)
