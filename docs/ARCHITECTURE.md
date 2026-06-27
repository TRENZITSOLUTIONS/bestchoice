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

## Data Flow

### Checkout & Payment Flow

```
User clicks "Pay"
    │
    ▼
Frontend POST /checkout/
    │
    ▼
Backend:                                                Razorpay API
  1. Validate cart ──────────────────────────────────────────┐
  2. Create Order (status=pending)                            │
  3. Deduct stock                                              │
  4. Create Razorpay order ◄──────────────── client.order.create()
  5. Save razorpay_order_id                                    │
  6. Clear cart                                                │
    │                                                          │
    ▼                                                          │
Frontend receives { razorpay_order_id, key_id, amount }        │
    │                                                          │
    ▼                                                          │
Load checkout.razorpay.com/v1/checkout.js                      │
    │                                                          │
    ▼                                                          │
Razorpay Checkout Modal ──────────────────────────────────────┘
  User pays via UPI/Card/Netbanking
    │
    ├── Success → handler(response) ──┐
    │    razorpay_payment_id          │
    │    razorpay_signature           │
    │                                 ▼
    │                    Frontend POST /payment/verify/
    │                                 │
    │                                 ▼
    │                    Backend: signature verification
    │                      • client.utility.verify_payment_signature()
    │                      • Order → status=confirmed, payment=paid
    │                      • Credit loyalty points
    │                                 │
    │                                 ▼
    │                    Response { success, order_id }
    │                                 │
    │                                 ▼
    │                    Frontend redirects to /account/orders/{id}
    │
    └── Cancel → modal.ondismiss()
                         │
                         ▼
              Frontend shows "Payment cancelled"
              Order stays pending (will be cleaned up)
```

### Cancellation & Refund Flow

```
User clicks "Cancel Order"
    │
    ▼
Frontend POST /orders/{id}/cancel/
    │
    ▼
Backend:
  1. Validate order can be cancelled
  2. Restore stock for each item
  3. If paid → call Razorpay refund API
  4. Mark payment_status = refunded
  5. Reverse loyalty points
  6. Order status = cancelled
```

### Inventory Flow

```
Supplier → Receive Stock → SKU Created → Upload to Site
                                              │
                                    Customer Orders
                                              │
                                    Auto Stock Deduct
                                              │
                                    ┌─────────┴─────────┐
                                    ▼                   ▼
                              Packing            Cancellation
                                    │                   │
                                    ▼                   ▼
                           Shipping/Pickup      Stock Restored
                                    │
                                    ▼
                              Delivered
```

## Database Relationships

```
User ──▶ Cart ──▶ CartItem ──▶ ProductVariant ──▶ Product
  │                                                     │
  ├──▶ Order ──▶ OrderItem ───▶ ProductVariant          │
  │       │                                            │
  │       ├──▶ Refund                                  │
  │       └──▶ LoyaltyTransaction                      │
  │                                                     │
  ├──▶ WishlistItem ──▶ Product                        │
  │                                                     │
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
                                                        └──▶ RelatedProduct
```

## Image Storage

```
Upload → S3 Bucket (ap-south-1)
           │
           ▼
    CloudFront CDN Distribution
           │
           ▼
    {cloudfront_url}/media/products/{id}/thumb/001.jpg
    {cloudfront_url}/media/products/{id}/small/001.jpg
    {cloudfront_url}/media/products/{id}/medium/001.jpg
    {cloudfront_url}/media/products/{id}/large/001.jpg
```

S3 activated when `AWS_STORAGE_BUCKET_NAME` is set. Falls back to local `media/` folder in development.

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
│  cartStore:                                             │
│    - items, coupon, subtotal, total                     │
│    - addItem, updateQty, removeItem, applyCoupon        │
│                                                         │
│  authStore:                                             │
│    - user, accessToken, refreshToken, isAuthenticated   │
│    - login, register, logout, refreshToken               │
│                                                         │
├────────────────────────────────────────────────────────┤
│                   React Query                           │
│                                                         │
│  Query Keys:                                            │
│    ['products', { filters }]     → Product listing      │
│    ['product', slug]             → Product detail       │
│    ['cart']                      → Cart (refetched)     │
│    ['orders']                    → Order list           │
│    ['order', id]                 → Order detail         │
│    ['wishlist']                  → Wishlist             │
│    ['loyalty-balance']           → Points balance       │
│    ['loyalty-transactions']      → Points history       │
│    ['reviews', slug]             → Product reviews      │
└────────────────────────────────────────────────────────┘
```

## Backend App Responsibilities

| App | Responsibility | Key Models |
|---|---|---|
| `accounts` | User management, JWT auth | User |
| `products` | Catalog: categories, brands, products, variants, images | Category, Brand, Product, ProductVariant, ProductImage |
| `cart` | Shopping cart (auth + guest sessions) | Cart, CartItem |
| `orders` | Checkout, payment, orders, refunds | Order, OrderItem, Refund |
| `coupons` | Coupon codes, validation, usage tracking | Coupon, CouponUsage |
| `reviews` | Product reviews, ratings, moderation | Review |
| `wishlist` | Save-for-later products | WishlistItem |
| `loyalty` | Points earn/spend/expire tracking | LoyaltyTransaction |
| `delivery` | Pincode-based delivery availability | DeliveryPincode |

## URL Routing

```
api/auth/       → accounts.urls (register, login, token refresh, me)
api/products/   → products.urls (list, detail)
api/categories/ → products.urls (category tree)
api/cart/       → cart.urls (get, add, update, remove, coupon)
api/checkout/   → orders.urls (create order + payment)
api/payment/    → orders.urls (verify, webhook)
api/orders/     → orders.urls (list, detail, cancel, refund)
api/coupons/    → coupons.urls (apply, validate)
api/reviews/    → reviews.urls (product reviews, my reviews)
api/wishlist/   → wishlist.urls (add, remove, list)
api/loyalty/    → loyalty.urls (balance, transactions)
api/delivery/   → delivery.urls (pincode check)
```

## Security Model

- **Auth**: JWT Bearer tokens (24h access, 30d refresh)
- **Permissions**: `AllowAny` by default, `IsAuthenticated` on protected endpoints
- **Throttling**: 100 req/hour anon, 1000 req/hour authenticated
- **CORS**: Whitelist of allowed origins (configurable via env)
- **Payments**: Signature verification server-side (never trust client-only)
- **Storage**: S3 bucket with `public-read` ACL, CloudFront for edge delivery
