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

- **Customers sign in with Google only.** There is no customer password, and no password registration. `POST /auth/google/` verifies a Google ID token server-side. Page: `/auth/login`. A guest's cart is merged into their account on sign-in.
- **Staff sign in with email + password** at a deliberately separate endpoint, `POST /auth/staff/login/`, which rejects non-staff accounts. Page: `/staff/login` — not linked from the storefront and excluded from robots.txt. It lands on the `/staff` dashboard.
- **Django Admin** at `/admin/` uses normal Django session auth, untouched by the above.

`is_staff` is the only role distinction in the system. It gates the `/staff` dashboard and every `/api/admin/*` route; a signed-in customer hitting one gets a 403.

`POST /auth/register/` and `POST /auth/login/` do not exist. Details in [API-SPECS.md](API-SPECS.md#-auth-endpoints); setup in [ENVIRONMENT.md](ENVIRONMENT.md#google-sign-in).

---

## Two things that will bite you

**1. Frontend config is baked in at build time.** Next.js compiles every `NEXT_PUBLIC_*` value into the browser bundle when `npm run build` runs. Changing one needs a rebuild, not a restart — and the default `NEXT_PUBLIC_API_URL` is `http://localhost:8000/api`, so forgetting it in production ships a site that calls the visitor's own machine. See [ENVIRONMENT.md](ENVIRONMENT.md#the-one-thing-that-trips-people-up).

**2. Production requires S3.** The backend refuses to start with `DJANGO_DEBUG=False` and no `AWS_STORAGE_BUCKET_NAME`. Django doesn't serve local `media/` outside DEBUG, so without a bucket every product image would 404 with nothing in the logs. Failing at startup is the intended behaviour. See [ENVIRONMENT.md](ENVIRONMENT.md#image-storage-s3).

---

## Current state

**Customer storefront:** home, listing with filters, product detail, cart, checkout with Razorpay, Google sign-in, account area (orders, tracking, cancel, refund request, wishlist, loyalty), and the four policy pages.

**Staff dashboard** at `/staff`: revenue and order stats with a revenue chart, order management with filters and bulk mark-shipped, inventory with stock flags and inline editing, refund approval, review moderation, coupon management, pincode lookup, and sales reports. See [ADMIN.md](ADMIN.md).

**Backend:** the 5-category / 38-node tree, category-specific product fields, every brief-required filter, state-aware delivery pricing, the image compression pipeline, working coupons, reviews with moderation and verified-purchase, wishlist, and the fully configurable loyalty programme. 222 tests pass.

**Not built:**
- Product/variant *creation* and bulk CSV upload — Django Admin only. The dashboard reads and edits.
- Low-stock alerting — the dashboard flags low stock on screen, but nothing emails anyone. There is no `reorder_level` field.
- CSV export from the dashboard.
- WhatsApp bot automation — the `wa.me` link is the agreed scope ([WHATSAPP.md](WHATSAPP.md)).
- OTP / password reset — not needed while customers sign in with Google.
- Finer-grained staff roles: any `is_staff` user can do everything in the dashboard.

**Known rough edges,** documented rather than hidden:
- Every page is client-rendered (`'use client'`), despite docs elsewhere describing SSR for SEO. Product and listing pages would benefit most from changing that.
- The policy pages are unreviewed drafts with placeholder contact details — they carry a visible notice saying so, and need the owner's sign-off before launch.
- The shipping policy's remaining open questions are unanswered: who pays return shipping, whether exchanges are offered, tax treatment of displayed prices, and the rest-of-India timeline.
- Reviews can be written by anyone, whether or not they bought the product; `is_verified_purchase` distinguishes them but nothing gates it.
- `/reviews/mine/` has no frontend page, so an author can't revisit a pending review after the initial confirmation.

---

## Docs that drift

These docs are maintained by hand and the code moves faster. When a doc and the code disagree, **the code wins** — please fix the doc in the same commit. Endpoint shapes in particular have been wrong before: check the serializer or `curl` the endpoint rather than trusting a documented response body.
