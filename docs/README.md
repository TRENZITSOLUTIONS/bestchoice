# BestChoice Documentation

An e-commerce store for BestChoice Clothing (Spencer Plaza, Chennai) — clothing, cosmetics, and mobile accessories, delivered across Tamil Nadu.

**Django 4.2 + DRF** API · **PostgreSQL 15** · **Next.js 16** storefront · **Razorpay** payments · **S3/CloudFront** images

---

## Start here

Pick the row that matches what you're doing.

| I want to… | Read |
|---|---|
| Understand how the system is put together | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Run it on my machine | [SETUP.md](SETUP.md) |
| Put it on a server | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Know what a config value does or where to get it | [ENVIRONMENT.md](ENVIRONMENT.md) |
| Call the API | [API-SPECS.md](API-SPECS.md) |
| Add products, stock, and images | [INVENTORY-SETUP.md](INVENTORY-SETUP.md) |

New to the project? Read [ARCHITECTURE.md](ARCHITECTURE.md), then [SETUP.md](SETUP.md), and get it running locally before anything else.

---

## Everything else

**Operating the store**
- [INVENTORY-SETUP.md](INVENTORY-SETUP.md) — products, variants, SKUs, stock, bulk CSV import
- [ADMIN.md](ADMIN.md) — what Django Admin can do today
- [DELIVERY.md](DELIVERY.md) — Tamil Nadu pincode rates vs. outside-state, store pickup
- [COUPONS.md](COUPONS.md) — discount types, limits, validity
- [LOYALTY.md](LOYALTY.md) — Best Choice Rewards: earning, redemption, expiry
- [WHATSAPP.md](WHATSAPP.md) — the support link

**Building on it**
- [ARCHITECTURE.md](ARCHITECTURE.md) — apps, models, data flow, frontend conventions
- [API-SPECS.md](API-SPECS.md) — every endpoint, request and response shapes
- [PRODUCT-PAGE.md](PRODUCT-PAGE.md) — product detail page behaviour
- [ENVIRONMENT.md](ENVIRONMENT.md) — every environment variable

---

## How authentication works

Worth knowing up front, because it is unusual and it is easy to assume otherwise:

- **Customers sign in with Google only.** There is no customer password, and no password registration. `POST /auth/google/` verifies a Google ID token server-side. Page: `/auth/login`.
- **Staff sign in with email + password** at a deliberately separate endpoint, `POST /auth/staff/login/`, which rejects non-staff accounts. Page: `/staff/login` — not linked from the storefront and excluded from robots.txt.
- **Django Admin** at `/admin/` uses normal Django session auth, untouched by the above.

`POST /auth/register/` and `POST /auth/login/` do not exist. Details in [API-SPECS.md](API-SPECS.md#-auth-endpoints); setup in [ENVIRONMENT.md](ENVIRONMENT.md#google-sign-in).

---

## Two things that will bite you

**1. Frontend config is baked in at build time.** Next.js compiles every `NEXT_PUBLIC_*` value into the browser bundle when `npm run build` runs. Changing one needs a rebuild, not a restart — and the default `NEXT_PUBLIC_API_URL` is `http://localhost:8000/api`, so forgetting it in production ships a site that calls the visitor's own machine. See [ENVIRONMENT.md](ENVIRONMENT.md#the-one-thing-that-trips-people-up).

**2. Production requires S3.** The backend refuses to start with `DJANGO_DEBUG=False` and no `AWS_STORAGE_BUCKET_NAME`. Django doesn't serve local `media/` outside DEBUG, so without a bucket every product image would 404 with nothing in the logs. Failing at startup is the intended behaviour. See [ENVIRONMENT.md](ENVIRONMENT.md#image-storage-s3).

---

## Current state

**Built and working:** the full storefront (home, listing with filters, product detail, cart, checkout with Razorpay, Google auth, account area with orders / wishlist / loyalty), and the backend behind it — category tree, category-specific product fields, all brief-required filters, state-aware delivery pricing, the image compression pipeline, coupons, reviews, wishlist, and the loyalty program. 124 backend tests pass.

**Not built:**
- A custom admin dashboard — Django Admin covers day-to-day operations. Sales charts and bulk "mark shipped" are the notable gaps ([ADMIN.md](ADMIN.md)).
- Legal pages (privacy, terms, refund, shipping) — client copy exists, pages don't.
- WhatsApp bot automation — the `wa.me` link is the agreed scope ([WHATSAPP.md](WHATSAPP.md)).
- OTP / password reset — not needed while customers use Google.

**Known rough edges,** documented rather than hidden:
- Coupon application isn't persisted on the cart; the discount is recomputed per request.
- Review moderation has an `is_approved` field, but new reviews are auto-approved, so nothing is actually held back.
- `Product.total_stock` doesn't auto-sync when variant stock changes.
- Cart doesn't merge a guest session cart into the user's cart on sign-in.
- Redis runs in the compose stack but no code uses it.

---

## Docs that drift

These docs are maintained by hand and the code moves faster. When a doc and the code disagree, **the code wins** — please fix the doc in the same commit. Endpoint shapes in particular have been wrong before: check the serializer or `curl` the endpoint rather than trusting a documented response body.
