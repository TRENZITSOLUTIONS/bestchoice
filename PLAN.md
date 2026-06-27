# BestChoice E-Commerce — Project Plan

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django + Django REST Framework |
| **Frontend** | Next.js (React, SSR) |
| **Database** | PostgreSQL |
| **Image Storage** | AWS S3 + CloudFront CDN |
| **Payment** | Razorpay |
| **Auth** | Simple JWT (Django REST Framework) |
| **Cache** | Redis |
| **Admin** | Django Admin (devs) + Custom Dashboard (business) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                Frontend (Next.js)                     │
│  SSR/ISR · TailwindCSS · React Query                 │
│  next/image (S3/CloudFront URLs)                     │
│  Zustand (client state)                              │
└────────────────────┬────────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼────────────────────────────────┐
│              Backend (Django + DRF)                   │
│  JWT Auth · Search/Filter · Thumbnail generation     │
│  Celery (async tasks — email, refunds)               │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              PostgreSQL + Redis                       │
│  Products · Orders · Users · Inventory · Coupons     │
└─────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
bestchoice/
├── backend/                         # Django project
│   ├── config/                      # settings, urls, wsgi
│   ├── apps/
│   │   ├── accounts/                # User model, auth
│   │   ├── products/                # Category, Brand, Product, Variant
│   │   ├── cart/                    # Cart, CartItem
│   │   ├── orders/                  # Order, OrderItem, Refund
│   │   ├── coupons/                 # Coupon codes
│   │   ├── reviews/                 # Reviews, ratings
│   │   ├── wishlist/                # Wishlist
│   │   ├── loyalty/                 # Loyalty points
│   │   └── delivery/                # Pincode, delivery config
│   ├── media/                       # Local dev media (S3 in prod)
│   └── requirements.txt
│
├── frontend/                        # Next.js project
│   ├── app/                         # App router pages
│   │   ├── page.tsx                 # Home
│   │   ├── products/                # Listing + detail
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── account/
│   │   └── admin/                   # Custom business dashboard
│   ├── components/                  # Reusable components
│   ├── lib/                         # API client, utils
│   └── public/                      # Static assets
│
├── admin-panel/                     # Custom business dashboard (Next.js)
│   (or part of frontend/app/admin)
│
└── docs/                            # Additional docs
```

---

## Inventory Flow

```
Supplier
  ↓
Inventory Receive
  ↓
SKU Created (auto-generated via Django signal)
  ↓
Product Uploaded to Website (with images → S3/CloudFront)
  ↓
Customer Orders
  ↓
Stock Automatically Reduced (on order placement)
  ↓
Cancellation → Stock Restored
  ↓
Packing
  ↓
Shipping / Store Pickup
  ↓
Delivered / Picked Up
```

---

## Image Pipeline

1. Admin uploads images via Django Admin or bulk import
2. Django generates 4 sizes on upload (Pillow + django-imagekit):
   - `thumbnail` (150×150)
   - `small` (400×400)
   - `medium` (800×800)
   - `large` (1200×1200)
3. All sizes uploaded to S3
4. CloudFront CDN serves them globally
5. Next.js `next/image` serves appropriate size per viewport + lazy loads

---

## Database Schema

### accounts_user
| Column | Type |
|---|---|
| id | UUID (PK) |
| email | EmailField (unique) |
| phone | CharField (unique) |
| password | Hashed |
| first_name | CharField |
| last_name | CharField |
| is_active | Boolean |
| is_staff | Boolean |
| created_at | DateTime |
| loyalty_points | IntegerField (default 0) |

### products_category
| Column | Type |
|---|---|
| id | AutoField (PK) |
| name | CharField |
| slug | SlugField (unique) |
| parent | FK → self (null) |
| image | ImageField → S3 |
| is_active | Boolean |
| sort_order | IntegerField |

### products_brand
| Column | Type |
|---|---|
| id | AutoField (PK) |
| name | CharField |
| slug | SlugField (unique) |
| logo | ImageField → S3 |
| is_active | Boolean |

### products_product
| Column | Type |
|---|---|
| id | AutoField (PK) |
| auto_product_id | CharField (unique, auto-generated) |
| name | CharField |
| slug | SlugField (unique) |
| short_description | TextField |
| description | RichTextField |
| category | FK → Category |
| brand | FK → Brand |
| mrp | DecimalField |
| selling_price | DecimalField |
| gst_included | BooleanField (default True) |
| is_active | BooleanField |
| hide_if_out_of_stock | BooleanField (default False) |
| total_stock | IntegerField (calculated from variants) |
| created_at | DateTimeField |
| updated_at | DateTimeField |

### products_productimage
| Column | Type |
|---|---|
| id | AutoField (PK) |
| product | FK → Product |
| image | ImageField → S3 |
| alt_text | CharField |
| sort_order | IntegerField |
| is_primary | BooleanField |

### products_productvariant
| Column | Type |
|---|---|
| id | AutoField (PK) |
| product | FK → Product |
| color | CharField |
| size | CharField |
| sku | CharField (unique, auto-generated) |
| stock | IntegerField |
| price_override | DecimalField (null) |
| is_active | BooleanField |

### products_producthighlight
| Column | Type |
|---|---|
| id | AutoField (PK) |
| product | FK → Product |
| text | CharField |
| sort_order | IntegerField |

### products_relatedproduct
| Column | Type |
|---|---|
| id | AutoField (PK) |
| product | FK → Product |
| related_product | FK → Product |
| type | CharField (similar/bought_together/recommended) |

### cart_cart
| Column | Type |
|---|---|
| id | AutoField (PK) |
| user | FK → User (nullable for guest) |
| session_id | CharField (null) |
| created_at | DateTime |
| updated_at | DateTime |

### cart_cartitem
| Column | Type |
|---|---|
| id | AutoField (PK) |
| cart | FK → Cart |
| product | FK → Product |
| variant | FK → ProductVariant (null) |
| quantity | IntegerField |
| price | DecimalField |

### orders_order
| Column | Type |
|---|---|
| id | AutoField (PK) |
| order_id | CharField (unique, readable) |
| user | FK → User |
| items | JSONField (snapshot) |
| subtotal | DecimalField |
| discount | DecimalField |
| coupon | FK → Coupon (null) |
| total | DecimalField |
| status | CharField (pending/confirmed/packed/shipped/delivered/cancelled) |
| payment_status | CharField (pending/paid/refunded/failed) |
| razorpay_order_id | CharField (null) |
| shipping_address | JSONField |
| delivery_type | CharField (home/store_pickup) |
| delivery_charge | DecimalField |
| estimated_delivery | DateField |
| tracking_url | CharField (null) |
| notes | TextField |
| created_at | DateTime |
| updated_at | DateTime |

### orders_orderitem
| Column | Type |
|---|---|
| id | AutoField (PK) |
| order | FK → Order |
| product | FK → Product |
| variant | FK → ProductVariant (null) |
| product_snapshot | JSONField |
| quantity | IntegerField |
| price | DecimalField |

### orders_refund
| Column | Type |
|---|---|
| id | AutoField (PK) |
| order | FK → Order |
| amount | DecimalField |
| reason | TextField |
| status | CharField (requested/approved/rejected/processed) |
| razorpay_refund_id | CharField (null) |
| created_at | DateTime |

### coupons_coupon
| Column | Type |
|---|---|
| id | AutoField (PK) |
| code | CharField (unique) |
| discount_type | CharField (percentage/fixed) |
| discount_value | DecimalField |
| min_cart_value | DecimalField |
| max_discount | DecimalField (null) |
| valid_from | DateTime |
| valid_till | DateTime |
| usage_limit | IntegerField |
| used_count | IntegerField |
| is_active | Boolean |

### reviews_review
| Column | Type |
|---|---|
| id | AutoField (PK) |
| user | FK → User |
| product | FK → Product |
| order | FK → Order (null) |
| rating | IntegerField (1-5) |
| text | TextField |
| images | JSONField (S3 URLs) |
| is_verified_purchase | BooleanField |
| is_approved | BooleanField |
| created_at | DateTime |

### wishlist_wishlistitem
| Column | Type |
|---|---|
| id | AutoField (PK) |
| user | FK → User |
| product | FK → Product |
| created_at | DateTime |

### loyalty_pointstransaction
| Column | Type |
|---|---|
| id | AutoField (PK) |
| user | FK → User |
| points | IntegerField (+/-) |
| type | CharField (earned/spent/expired) |
| order | FK → Order (null) |
| description | CharField |
| created_at | DateTime |

### delivery_pincode
| Column | Type |
|---|---|
| id | AutoField (PK) |
| pincode | CharField |
| city | CharField |
| state | CharField (default: Tamilnadu) |
| delivery_days | CharField (same_day/2-3_days) |
| store_pickup_available | BooleanField |
| cod_available | BooleanField |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register/ | Register with email/phone |
| POST | /api/auth/login/ | JWT login |
| POST | /api/auth/otp/ | Send OTP |
| POST | /api/auth/otp/verify/ | Verify OTP |
| POST | /api/auth/token/refresh/ | Refresh JWT |
| GET | /api/auth/me/ | Current user profile |
| PUT | /api/auth/me/ | Update profile |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/products/ | List with search, filters, pagination |
| GET | /api/products/{slug}/ | Detail with variants, images, highlights |
| GET | /api/categories/ | Category tree |
| GET | /api/brands/ | Brand list |
| GET | /api/products/{slug}/related/ | Related products |

### Cart
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/cart/ | Get cart |
| POST | /api/cart/items/ | Add item |
| PUT | /api/cart/items/{id}/ | Update quantity |
| DELETE | /api/cart/items/{id}/ | Remove item |
| POST | /api/cart/apply-coupon/ | Apply coupon code |
| DELETE | /api/cart/remove-coupon/ | Remove coupon |

### Checkout & Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/checkout/ | Create order from cart |
| GET | /api/orders/ | User order history |
| GET | /api/orders/{id}/ | Order detail + tracking |
| POST | /api/orders/{id}/cancel/ | Cancel order |
| POST | /api/orders/{id}/refund/ | Request refund |
| GET | /api/orders/tracking/{order_id}/ | Tracking info |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/products/{slug}/reviews/ | List reviews |
| POST | /api/products/{slug}/reviews/ | Create review |
| GET | /api/reviews/mine/ | My reviews |

### Wishlist
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/wishlist/ | List wishlist |
| POST | /api/wishlist/ | Add to wishlist |
| DELETE | /api/wishlist/{product_id}/ | Remove |

### Loyalty
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/loyalty/balance/ | Points balance |
| GET | /api/loyalty/transactions/ | Points history |

### Delivery
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/delivery/check/{pincode}/ | Check availability |

---

## Frontend Pages (Next.js App Router)

| Route | SSR/CSR | Description |
|---|---|---|
| `/` | SSR | Home — hero offers, featured products, categories |
| `/products` | SSR | Listing with sidebar filters, search, sort, grid |
| `/products/[slug]` | SSR | Product detail with gallery, variants, reviews |
| `/cart` | CSR | Cart items, coupon, summary |
| `/checkout` | CSR | Address, delivery option, payment |
| `/orders` | SSR | Order history |
| `/orders/[id]` | SSR | Order detail + tracking |
| `/wishlist` | CSR | Wishlist grid |
| `/account` | SSR | Profile, addresses |
| `/account/loyalty` | SSR | Loyalty points |
| `/account/reviews` | CSR | My reviews |
| `/auth/login` | CSR | Login |
| `/auth/register` | CSR | Register |
| `/admin/*` | CSR | Business dashboard |

---

## Frontend Components Structure

```
components/
├── layout/
│   ├── Header.tsx          (nav, search, cart icon, user menu)
│   ├── Footer.tsx
│   ├── MobileNav.tsx
│   └── Layout.tsx
├── product/
│   ├── ProductCard.tsx     (grid card)
│   ├── ProductGallery.tsx  (image viewer with zoom)
│   ├── VariantSelector.tsx (color/size picker)
│   ├── PriceDisplay.tsx    (MRP, selling, discount %)
│   ├── StockBadge.tsx      (In Stock / X Left / OOS)
│   ├── ProductHighlights.tsx
│   └── RelatedProducts.tsx
├── cart/
│   ├── CartItem.tsx
│   ├── CartSummary.tsx
│   └── CouponInput.tsx
├── checkout/
│   ├── AddressForm.tsx
│   ├── DeliveryOptions.tsx
│   ├── PaymentButton.tsx   (Razorpay integration)
│   └── OrderReview.tsx
├── review/
│   ├── ReviewList.tsx
│   ├── ReviewCard.tsx
│   └── WriteReviewModal.tsx
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Skeleton.tsx        (loading states)
│   ├── StarRating.tsx
│   └── ImageWithFallback.tsx
└── account/
    ├── OrderCard.tsx
    ├── AddressCard.tsx
    └── LoyaltyCard.tsx
```

---

## Image Optimization Strategy

1. **On upload** — Django generates 4 sizes via `django-imagekit`:
   - `thumb` (150×150) — for grids
   - `small` (400×400) — for mobile detail
   - `medium` (800×800) — for desktop detail
   - `large` (1200×1200) — for zoom/enlarge

2. **Storage** — All sizes pushed to S3 with folder structure:
   ```
   products/{product_id}/thumb/001.jpg
   products/{product_id}/small/001.jpg
   products/{product_id}/medium/001.jpg
   products/{product_id}/large/001.jpg
   ```

3. **Frontend** — `next/image` with CloudFront URLs:
   ```tsx
   <Image
     src={cloudFrontUrl + "/medium/001.jpg"}
     sizes="(max-width: 768px) 100vw, 50vw"
     priority={isFirstImage}
   />
   ```

4. **CloudFront** — Caches at edge. Cache headers: `max-age=31536000, public` for immutability.

---

## Admin Panels

### Django Admin (Developers)
- Full CRUD on all models
- Bulk upload via Excel/CSV (django-import-export)
- Duplicate product action
- User management
- Raw data access

### Custom Business Dashboard (Next.js)
Built into `/admin/*` routes:
- Real-time orders dashboard
- Inventory view with low-stock alerts
- Create coupons
- View/manage refunds
- Sales reports
- Manage products (basic CRUD)
- Delivery pincode management

---

## Performance Budget

| Metric | Target |
|---|---|
| Lighthouse Performance | 90+ |
| First Contentful Paint | <1.5s |
| Largest Contentful Paint | <2.5s |
| Time to Interactive | <3s |
| Image Weight Per Page | <500KB |
| API Response (product detail) | <200ms |

---

## Phases

| Phase | What | Duration (est.) |
|---|---|---|
| 1 | Django project setup + PostgreSQL + DRF | 1 day |
| 2 | Core models (User, Category, Product, Variant) | 1 day |
| 3 | DRF API endpoints | 2 days |
| 4 | Next.js frontend scaffolding | 1 day |
| 5 | Product listing + detail page (S3/CloudFront) | 2 days |
| 6 | Cart, checkout, Razorpay | 2 days |
| 7 | Orders, tracking, refunds, loyalty | 2 days |
| 8 | Reviews, wishlist, coupons | 1 day |
| 9 | Admin dashboard (custom) + Django admin | 2 days |
| 10 | WhatsApp, delivery, polish, deploy | 2 days |

---

## Deployment

| Service | Provider |
|---|---|
| Frontend | Vercel |
| Backend | Railway or AWS EC2 |
| Database | AWS RDS (PostgreSQL) or Railway |
| Image Storage | AWS S3 |
| CDN | AWS CloudFront |
| Domain | Any registrar → Cloudflare DNS |
