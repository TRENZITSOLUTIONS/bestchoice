# API Specifications

> **Status**: ✅ = Built & working · 🚧 = Documented but not yet implemented

## Base URL
- Development: `http://localhost:8000/api/`
- Production: `https://api.bestchoice.in/api/`

## Authentication
- JWT Bearer token in `Authorization` header
- Obtain: `POST /auth/login/`
- Refresh: `POST /auth/token/refresh/`
- 24h access token lifetime, 30d refresh token

---

## ✅ Auth Endpoints

### POST /auth/register/
```json
{ "email": "user@example.com", "phone": "9876543210", "password": "securepass123", "first_name": "John", "last_name": "Doe" }
// 201
{ "id": "uuid", "email": "user@example.com", "phone": "9876543210", "access": "jwt_token", "refresh": "refresh_token" }
```

### POST /auth/login/
```json
{ "email": "user@example.com", "password": "securepass123" }
// 200 { "access": "...", "refresh": "...", "user": {"id": "...", "email": "...", "first_name": "John", "loyalty_points": 50} }
```

### POST /auth/token/refresh/
```json
{ "refresh": "refresh_token" }
// 200 { "access": "new_access_token" }
```

### GET /auth/me/
```
Headers: Authorization: Bearer <token>
// 200
{ "id": "uuid", "email": "user@example.com", "phone": "9876543210", "first_name": "John", "last_name": "Doe", "loyalty_points": 250 }
```

### PUT /auth/me/
```json
{ "first_name": "Johnny", "phone": "9876543211" }
// 200 { "id": "...", "first_name": "Johnny", ... }
```

### 🚧 POST /auth/otp/
```json
{ "phone": "9876543210" }
// 200 { "message": "OTP sent", "otp_length": 6 }
```

### 🚧 POST /auth/otp/verify/
```json
{ "phone": "9876543210", "otp": "123456" }
// 200 { "access": "...", "refresh": "...", "is_new_user": false }
```

---

## ✅ Products

### GET /products/
**Query Params:**
| Param | Type | Description |
|---|---|---|
| search | string | Search name, SKU, brand, category, description |
| category | slug | Filter by category slug |
| brand | slug | Filter by brand slug |
| min_price | decimal | Min selling price |
| max_price | decimal | Max selling price |
| color | string | Filter by color |
| size | string | Filter by size |
| discount | int | Min discount % (e.g., 30) |
| sort | string | `newest`, `price_low`, `price_high`, `popular`, `discount` |
| page | int | Page number |
| page_size | int | Items per page (default 20) |

**Response:**
```json
{
  "count": 120,
  "next": "http://localhost:8000/api/products/?page=3",
  "previous": null,
  "results": [
    {
      "id": 1,
      "product_id": "BC-SHT-000001",
      "name": "Premium Cotton Shirt",
      "slug": "premium-cotton-shirt",
      "category": { "id": 5, "name": "Shirts", "slug": "shirts" },
      "brand": { "id": 1, "name": "BestChoice", "slug": "bestchoice" },
      "primary_image": "https://cdn.bestchoice.in/thumb/001.jpg",
      "mrp": "1999.00",
      "selling_price": "1299.00",
      "discount_percent": 35,
      "has_variants": true,
      "in_stock": true,
      "average_rating": 4.3,
      "review_count": 28
    }
  ]
}
```

### GET /products/{slug}/
**Response:**
```json
{
  "id": 1,
  "product_id": "BC-SHT-000001",
  "name": "Premium Cotton Shirt",
  "slug": "premium-cotton-shirt",
  "short_description": "Premium quality cotton shirt for everyday comfort.",
  "description": "<p>Full detailed description in HTML...</p>",
  "category": {
    "id": 5, "name": "Shirts", "slug": "shirts",
    "parent": { "id": 1, "name": "Men's Wear", "slug": "mens-wear" }
  },
  "brand": { "id": 1, "name": "BestChoice", "slug": "bestchoice", "logo": "..." },
  "images": [
    { "id": 1, "image": "cdn.url/medium/001.jpg", "alt_text": "Front view", "is_primary": true, "sort_order": 0 }
  ],
  "variants": [
    { "id": 10, "color": "Red", "size": "M", "sku": "BC-SHT-000001-RED-M", "stock": 12, "price_override": null, "is_active": true },
    { "id": 11, "color": "Red", "size": "L", "sku": "BC-SHT-000001-RED-L", "stock": 0, "price_override": null, "is_active": true }
  ],
  "available_colors": ["Red", "Blue"],
  "available_sizes": ["M", "L", "XL"],
  "highlights": ["Premium Cotton", "Slim Fit", "Soft & Breathable"],
  "mrp": "1999.00",
  "selling_price": "1299.00",
  "discount_percent": 35,
  "gst_included": true,
  "total_stock": 17,
  "hide_if_out_of_stock": false,
  "has_variants": true,
  "average_rating": 4.3,
  "review_count": 28,
  "rating_distribution": { "5": 15, "4": 8, "3": 3, "2": 1, "1": 1 }
}
```

### GET /categories/
```json
[
  {
    "id": 1, "name": "Men's Wear", "slug": "mens-wear",
    "children": [
      { "id": 2, "name": "Shirts", "slug": "shirts", "product_count": 45 },
      { "id": 3, "name": "T-Shirts", "slug": "tshirts", "product_count": 60 }
    ]
  }
]
```

### GET /brands/
```json
[
  { "id": 1, "name": "BestChoice", "slug": "bestchoice", "logo": null, "is_active": true }
]
```

### 🚧 GET /products/{slug}/related/
Documented but endpoint not wired in URLs yet.

---

## ✅ Cart

### GET /cart/
```json
{
  "id": 1,
  "items": [
    {
      "id": 1,
      "product": { "id": 1, "name": "Premium Cotton Shirt", "slug": "...", "image": "..." },
      "variant": { "id": 10, "color": "Red", "size": "M", "sku": "BC-SHT-000001-RED-M" },
      "quantity": 2,
      "price": "1299.00",
      "total_price": "2598.00"
    }
  ],
  "subtotal": "2598.00",
  "discount": "0.00",
  "coupon": null,
  "total": "2598.00"
}
```

### POST /cart/items/
```json
{ "product_id": 1, "variant_id": 10, "quantity": 1 }
// 201 { "id": 1, "quantity": 1, "total_price": "1299.00" }
```

### PUT /cart/items/{id}/
```json
{ "quantity": 3 }
// 200 { "id": 1, "quantity": 3, "total_price": "3897.00" }
```

### DELETE /cart/items/{id}/
```
// 204 No Content
```

---

## ✅ Coupons

### POST /cart/apply-coupon/
```json
{ "code": "WELCOME20" }
// 200
{ "discount": "259.80", "discount_label": "20% off", "total": "2338.20", "coupon": { "code": "WELCOME20", "discount_percent": 20, "max_discount": 500 } }
// 400
{ "error": "Coupon expired or invalid" }
```

### DELETE /cart/remove-coupon/
```
// 200 { "message": "Coupon removed" }
```

---

## ✅ Checkout & Orders

### POST /checkout/
```json
{
  "shipping_address": {
    "full_name": "John Doe", "phone": "9876543210",
    "address_line1": "123, Anna Nagar",
    "address_line2": "", "city": "Chennai", "pincode": "600001", "state": "Tamilnadu"
  },
  "delivery_type": "home",
  "notes": "Leave at door"
}
// 201
{
  "order_id": "BC-ORD-20260627-0001",
  "total": "2598.00",
  "razorpay_order_id": "order_xxxxxxxx",
  "razorpay_key_id": "rzp_live_xxxx",
  "amount_in_paise": 259800
}
```

### POST /payment/verify/
```json
{
  "razorpay_order_id": "order_xxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxx",
  "razorpay_signature": "sig_xxxxxxxx"
}
// 200 { "success": true, "order_id": "BC-ORD-...", "status": "confirmed" }
// 400 { "error": "Payment verification failed" }
```

### GET /orders/
```json
{
  "count": 5,
  "results": [
    {
      "order_id": "BC-ORD-...",
      "status": "shipped",
      "payment_status": "paid",
      "total": "2598.00",
      "items_count": 2,
      "created_at": "2026-06-27T10:00:00Z"
    }
  ]
}
```

### GET /orders/{id}/
```json
{
  "order_id": "BC-ORD-...",
  "status": "shipped",
  "payment_status": "paid",
  "items": [...],
  "subtotal": "2598.00",
  "discount": "0.00",
  "total": "2598.00",
  "shipping_address": {...},
  "delivery_type": "home",
  "created_at": "2026-06-27T10:00:00Z",
  "razorpay_payment_id": "pay_xxxx"
}
```

### POST /orders/{id}/cancel/
```json
{ "reason": "Changed my mind" }
// 200 { "status": "cancelled", "message": "Order cancelled successfully" }
// 400 { "error": "Order cannot be cancelled" }
```

### POST /orders/{id}/refund/
```json
{ "reason": "Damaged product", "amount": "1299.00" }
// 200 { "status": "requested", "message": "Refund requested" }
```

### 🚧 GET /orders/tracking/{order_id}/
Documented but not yet implemented.

### 🚧 POST /payment/webhook/
Razorpay webhook for server-side payment confirmation (not yet built — recommended for production).

---

## ✅ Reviews

### GET /products/{slug}/reviews/
```json
{
  "average_rating": 4.3,
  "total_reviews": 28,
  "distribution": { "5": 15, "4": 8, "3": 3, "2": 1, "1": 1 },
  "results": [
    {
      "id": 1,
      "user": { "name": "Ravi K.", "avatar": null },
      "rating": 5,
      "text": "Great quality shirt!",
      "images": [],
      "is_verified_purchase": true,
      "is_approved": false,
      "created_at": "2026-06-20T10:00:00Z"
    }
  ]
}
```

### POST /products/{slug}/reviews/
```json
{ "rating": 5, "text": "Great product!", "images": [] }
// 201 { ...review }
```

### GET /reviews/mine/
Bearer required. Returns current user's reviews.

---

## ✅ Wishlist

### GET /wishlist/
```json
{ "results": [ { "id": 1, "product": { "id": 1, "name": "...", "slug": "...", "selling_price": "1299.00", "primary_image": "..." }, "created_at": "2026-06-20T10:00:00Z" } ] }
```

### POST /wishlist/
```json
{ "product_id": 1 }
// 201 { "id": 1, "product": 1 }
// 400 { "error": "Product already in wishlist" }
```

### DELETE /wishlist/{product_id}/
```
// 204 No Content
```

---

## ✅ Loyalty

### GET /loyalty/balance/
```json
{ "points": 250 }
```

### GET /loyalty/transactions/
```json
{
  "results": [
    { "points": 50, "type": "earned", "description": "Welcome bonus", "created_at": "2026-06-15T10:00:00Z" },
    { "points": 65, "type": "earned", "description": "Order BC-ORD-001", "created_at": "2026-06-20T10:00:00Z" }
  ]
}
```

---

## ✅ Delivery

### GET /delivery/check/{pincode}/
```json
// Available
{ "pincode": "600001", "city": "Chennai", "delivery_available": true, "delivery_type": "same_day", "estimated_days": "Today", "store_pickup": true, "cod_available": true, "delivery_charge": null }
// Not available
{ "pincode": "999999", "delivery_available": false, "message": "Delivery not available at this pincode" }
```

---

## Complete Endpoint Table

| # | Method | Path | Auth | Status |
|---|---|---|---|---|
| 1 | POST | /auth/register/ | — | ✅ |
| 2 | POST | /auth/login/ | — | ✅ |
| 3 | POST | /auth/token/refresh/ | — | ✅ |
| 4 | GET | /auth/me/ | Bearer | ✅ |
| 5 | PUT | /auth/me/ | Bearer | ✅ |
| 6 | GET | /products/ | — | ✅ |
| 7 | GET | /products/{slug}/ | — | ✅ |
| 8 | GET | /categories/ | — | ✅ |
| 9 | GET | /brands/ | — | ✅ |
| 10 | GET | /cart/ | Bearer/* | ✅ |
| 11 | POST | /cart/items/ | Bearer/* | ✅ |
| 12 | PUT | /cart/items/{id}/ | Bearer/* | ✅ |
| 13 | DELETE | /cart/items/{id}/ | Bearer/* | ✅ |
| 14 | POST | /cart/apply-coupon/ | Bearer/* | ✅ |
| 15 | DELETE | /cart/remove-coupon/ | Bearer/* | ✅ |
| 16 | POST | /checkout/ | Bearer | ✅ |
| 17 | POST | /payment/verify/ | Bearer | ✅ |
| 18 | GET | /orders/ | Bearer | ✅ |
| 19 | GET | /orders/{id}/ | Bearer | ✅ |
| 20 | POST | /orders/{id}/cancel/ | Bearer | ✅ |
| 21 | POST | /orders/{id}/refund/ | Bearer | ✅ |
| 22 | GET | /products/{slug}/reviews/ | — | ✅ |
| 23 | POST | /products/{slug}/reviews/ | Bearer | ✅ |
| 24 | GET | /reviews/mine/ | Bearer | ✅ |
| 25 | GET | /wishlist/ | Bearer | ✅ |
| 26 | POST | /wishlist/ | Bearer | ✅ |
| 27 | DELETE | /wishlist/{product_id}/ | Bearer | ✅ |
| 28 | GET | /loyalty/balance/ | Bearer | ✅ |
| 29 | GET | /loyalty/transactions/ | Bearer | ✅ |
| 30 | GET | /delivery/check/{pincode}/ | — | ✅ |
| 31 | POST | /auth/otp/ | — | 🚧 |
| 32 | POST | /auth/otp/verify/ | — | 🚧 |
| 33 | GET | /products/{slug}/related/ | — | 🚧 |
| 34 | GET | /orders/tracking/{id}/ | Bearer | 🚧 |
| 35 | POST | /payment/webhook/ | — | 🚧 |

* = session-based cart works without auth for guest users
