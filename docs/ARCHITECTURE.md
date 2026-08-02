# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                        │
│  Next.js SSR · TailwindCSS · React Query · Zustand · Axios      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
                    ┌──────────────┐
                    │  Cloudflare   │  DNS + DDoS protection
                    │     DNS       │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
       ┌────────────┐           ┌──────────────┐
       │   Vercel    │           │  Backend VM   │
       │  Frontend   │           │  Django + DRF │
       │  (Next.js)  │           │  Gunicorn     │
       └────────────┘           └──────┬────────┘
                                        │
                          ┌─────────────┼─────────────┐
                          ▼             ▼             ▼
                   ┌──────────┐  ┌──────────┐  ┌──────────┐
                   │PostgreSQL│  │  Redis   │  │    S3    │
                   │ (RDS)    │  │ (Elasti) │  │ + CF CDN │
                   └──────────┘  └──────────┘  └──────────┘
```

## Checkout & Payment Flow

```
User fills address + loyalty points → clicks "Pay"
    │
    ▼
Frontend POST /checkout/ { shipping_address, delivery_type, loyalty_points_used }
    │
    ▼
Backend:
  1. Validate cart + stock
  2. Calculate delivery_charge (weight × pincode)
  3. Calculate points discount (1pt = ₹1)
  4. Create Order with all fields
  5. Create Razorpay order ◄── client.order.create()
  6. Save razorpay_order_id
  7. Clear cart
    │
    ▼
Frontend receives { order_id, razorpay_order_id, key_id, amount, delivery_charge }
    │
    ▼
Load Razorpay Checkout → User pays via UPI/Card/Netbanking
    │
    ├── Success → handler(response) ──┐
    │    razorpay_payment_id          │
    │    razorpay_signature           │
    │                                 ▼
    │                    Frontend POST /payment/verify/
    │                                 │
    │                                 ▼
    │                    Backend: verify signature
    │                      • Deduct loyalty points if used
    │                      • Credit earned loyalty points
    │                      • Send order confirmation email
    │                      • Order → status=confirmed, payment=paid
    │                                 │
    │                                 ▼
    │                    Redirect to /account/orders/{id}
    │
    └── Cancel → modal.ondismiss()
                         │
                         ▼
              Order stays pending (cleanup scheduled)
```

## Cancellation & Refund Flow

```
User clicks "Cancel Order"
    │
    ▼
Frontend POST /orders/{id}/cancel/
    │
    ▼
Backend:
  1. Validate order can be cancelled (not shipped/delivered)
  2. Restore stock for each item
  3. If paid → call Razorpay refund API
  4. Mark payment_status = refunded
  5. Reverse earned loyalty points
  6. Refund used loyalty points
  7. Order status = cancelled
```

## Status History Tracking

Every status change on Order triggers automatic `OrderStatusHistory` creation via `Order.save()`. The history powers the timeline UI on `/account/orders/[id]`.

```
Order created        → status_history: [{ status: "pending", note: "Order created" }]
Admin confirms       → status_history: [{ status: "confirmed", note: "Status changed from pending to confirmed" }]
Admin ships          → status_history: [{ status: "shipped", note: "..." }]
...
```

## Database Relationships

```
User ──▶ Cart ──▶ CartItem ──▶ ProductVariant ──▶ Product
  │                                                     │
  ├──▶ Order ──▶ OrderItem ───▶ ProductVariant          │
  │       │                      │                      │
  │       ├──▶ Refund            └── OrderStatusHistory  │
  │       └──▶ LoyaltyTransaction                       │
  │                                                     │
  ├──▶ WishlistItem ──▶ Product                        │
  ├──▶ Review ──▶ Product                             │
  │                                                     │
  └──▶ LoyaltyTransaction                              │
                                                        │
                                              Product ──┼──▶ Category
                                                        │
                                                        ├──▶ Brand
                                                        │
                                                        ├──▶ ProductImage
                                                        │
                                                        ├──▶ ProductHighlight
                                                        │
                                                        ├──▶ RelatedProduct
                                                        │
                                                        └── weight_g (grams)
```

## User Model Extensions

| Field | Type | Default | Description |
|---|---|---|---|
| `date_of_birth` | DateField | null | Birthday (for bonus) |
| `referral_code` | CharField(20) | UUID hex | Unique referral code |
| `referred_by` | FK(User) | null | Referring user |
| `loyalty_points` | IntegerField | 0 | Points balance |

## Image Pipeline

Fully automatic — happens inside `ProductImage.save()`, no manual step:

```
┌──────────────┐   ┌─────────────────────┐   ┌───────────────────────────┐
│ Admin uploads │──▶│ Original compressed  │──▶│ 4 WebP sizes generated     │
│ a real file    │   │ (capped 2000x2000,   │   │ thumb 150px / small 400px  │
│ (ImageField)   │   │ JPEG q90) - the      │   │ medium 800px / large 1200px │
│                │   │ stored "original"    │   │ (q80, mobile-bandwidth-     │
│                │   │                      │   │ friendly)                  │
└──────────────┘   └─────────────────────┘   └─────────────┬─────────────┘
                                                             │
                                                  ┌──────────┴──────────┐
                                                  ▼                     ▼
                                           ┌──────────┐         ┌──────────────┐
                                           │   S3 +   │   or    │  Local media  │
                                           │ CloudFront│         │    folder     │
                                           └──────────┘         └──────────────┘
```

S3 activated when `AWS_STORAGE_BUCKET_NAME` is set (via `DEFAULT_FILE_STORAGE`). Falls back to local `media/` folder otherwise — both transparent to `ProductImage`, since Django's storage API handles the difference.

`python manage.py process_images` still exists but is now only an optional backfill/reprocess tool (e.g. after changing compression settings) — not part of the normal upload flow.

## Notifications

```
Payment Verified ──▶ notifications/utils.py ──▶ send_order_confirmation(order)
                      │
                      ├── Renders HTML template (notifications/order_confirmation.html)
                      ├── Sends via Django Email framework
                      ├── Console backend in dev (prints to terminal)
                      └── SMTP in prod (EMAIL_HOST, EMAIL_HOST_USER, etc.)
```

The `send_order_shipped()` function is also available for integration when the admin marks an order as shipped.

## Delivery Charge Calculation

```
delivery/utils.py:

  FREE_DELIVERY_THRESHOLD = ₹500
  BASE_CHARGES = { same_day: ₹30, standard: ₹80 }
  WEIGHT_SURCHARGE = ₹10 per 500g over 1kg

  calculate_delivery_charge(pincode, total_weight_g, order_total)
      → Free if order_total >= ₹500
      → Uses pincode's delivery_charge if set, else base charge by delivery_type
      → Adds weight surcharge for orders > 1kg
```

## Tech Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js SSR | SEO, fast initial render, next/image optimizations |
| State | React Query + Zustand | Server cache (React Query) + Client state (Zustand cart/auth) |
| Styling | TailwindCSS | Utility-first, fast iteration, small bundle with JIT |
| Auth | Simple JWT | Stateless, works well with DRF, no session overhead |
| Payments | Razorpay | Best India UPI support, easy integration, webhook support |
| Images | S3 + CloudFront | More control than Cloudinary, cheaper at scale, CDN edge caching |
| DB | PostgreSQL | JSON fields for snapshots, robust, well-supported by Django |
| Cache | Redis | Session store, API caching, Celery broker (planned) |

## Frontend State Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Zustand Stores                        │
│                                                         │
│  cartStore: items, coupon, subtotal, total              │
│  authStore: user, tokens, isAuthenticated               │
│                                                         │
├────────────────────────────────────────────────────────┤
│                   React Query                           │
│                                                         │
│  ['products', filters]    → Product listing             │
│  ['product', slug]        → Product detail              │
│  ['cart']                 → Cart                        │
│  ['orders']               → Order list                  │
│  ['order', id]            → Order detail                │
│  ['order-tracking', id]   → Order timeline              │
│  ['wishlist']             → Wishlist                    │
│  ['profile']              → User profile                │
│  ['loyalty-balance']      → Points balance              │
│  ['loyalty-transactions'] → Points history              │
│  ['reviews', slug]        → Product reviews             │
└────────────────────────────────────────────────────────┘
```

## Backend App Responsibilities

| App | Responsibility | Key Models |
|---|---|---|
| `accounts` | User management, JWT auth | User (+ referral_code, date_of_birth) |
| `products` | Catalog: categories, brands, products, variants, images | Category, Brand, Product (+ weight_g), ProductVariant, ProductImage, ProductHighlight, RelatedProduct |
| `cart` | Shopping cart (auth + guest sessions) | Cart, CartItem |
| `orders` | Checkout, payment, orders, refunds, tracking | Order, OrderItem, Refund, OrderStatusHistory |
| `coupons` | Coupon codes, validation, usage tracking | Coupon, CouponUsage |
| `reviews` | Product reviews, ratings, moderation | Review |
| `wishlist` | Save-for-later products | WishlistItem |
| `loyalty` | Points earn/spend/expire tracking | LoyaltyTransaction |
| `delivery` | Pincode-based delivery + charge calculation | DeliveryPincode |
| `notifications` | Email sending (utility + templates) | — (utils only) |

## URL Routing

```
api/auth/                           → accounts.urls
api/products/                       → products.urls (list, detail, categories, brands)
api/cart/                           → cart.urls
api/checkout/   api/payment/        → orders.urls
api/orders/<id>/                    → detail, track, cancel, refund
api/admin/orders/<id>/status/       → admin order status update
api/admin/products/<id>/            → admin product update
api/coupons/                        → coupons.urls
api/reviews/                        → reviews.urls
api/wishlist/                       → wishlist.urls
api/loyalty/                        → loyalty.urls
api/delivery/                       → delivery.urls
api/health/                         → health check
```

## Security Model

- **Auth**: JWT Bearer tokens (24h access, 30d refresh)
- **Permissions**: `AllowAny` by default, `IsAuthenticated` on protected endpoints
- **Throttling**: 100 req/hour anon, 1000 req/hour authenticated
- **CORS**: Whitelist of allowed origins (configurable via env)
- **Payments**: Signature verification server-side (never trust client-only)
- **Storage**: S3 bucket with `public-read` ACL, CloudFront for edge delivery
- **Email**: Console backend in dev, SMTP in prod (configured via env)
