# API Specifications

> **Status**: ✅ = Built & working · 🚧 = Documented but not yet implemented

## Base URL
- Development: `http://localhost:8000/api/`
- Production: `https://api.bestchoice.in/api/`

## Authentication
- JWT Bearer token in `Authorization` header
- Customers obtain a token via `POST /auth/google/` — Google is the only customer sign-in method. There is no password registration or password login for customers.
- Staff obtain a token via `POST /auth/staff/login/` (email + password, rejects non-staff accounts).
- Refresh: `POST /auth/token/refresh/`
- 24h access token lifetime, 30d refresh token

---

## ✅ Auth Endpoints

### POST /auth/google/
Verifies a Google Identity Services ID token server-side, then signs the customer in — creating the account on first use.

```json
{ "credential": "<google_id_token>", "referral_code": "ABC123DEFG" }
// 200 (existing user) / 201 (new account)
{ "user": {"id": "uuid", "email": "user@gmail.com", "first_name": "John", "loyalty_points": 50}, "access": "jwt_token", "refresh": "refresh_token" }
```

`referral_code` is optional and only applies when the account is created. If valid, both referrer and new user get the configured referral bonus. New accounts also receive the welcome bonus.

Errors: `400` missing credential or unverified Google email · `401` invalid credential · `503` `GOOGLE_OAUTH_CLIENT_ID` not configured.

Requires `GOOGLE_OAUTH_CLIENT_ID` (backend, for audience verification) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend, same value).

### POST /auth/staff/login/
Password login restricted to `is_staff` accounts. Customers cannot use this endpoint.

```json
{ "email": "manager@bestchoice.in", "password": "..." }
// 200 { "user": {...}, "access": "...", "refresh": "..." }
```

Errors: `400` missing fields · `401` bad credentials or inactive account · `403` valid credentials but not a staff account.

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
| fabric | string | Clothing - Cotton/Linen/Viscose/Denim/Polyester/Rayon/Blend/Others |
| fit | string | Clothing - Regular/Slim/Oversized/Relaxed |
| sleeve_type | string | Clothing - half_sleeve/full_sleeve |
| occasion | string | Clothing - Casual/Formal/Party/Ethnic |
| shade | string | Cosmetics |
| skin_type | string | Cosmetics (optional) |
| compatible_device | string | Mobile Accessories - substring match against compatible_devices |
| availability | string | `in_stock` or `out_of_stock` |
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
  "rating_distribution": { "5": 15, "4": 8, "3": 3, "2": 1, "1": 1 },
  "related": {
    "similar": [
      { "id": 2, "name": "Casual Cotton Shirt", "slug": "casual-cotton-shirt", "selling_price": "999.00", "mrp": "1499.00", "primary_image": "cdn.url/...", "discount_percent": 33 }
    ],
    "recommended": []
  }
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

### ✅ GET /products/{slug}/related/
Now included inline in the product detail response under `related.similar` and `related.recommended`. Uses manually curated RelatedProduct entries first, then falls back to same-category products.

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
    "address_line1": "123, Anna Nagar", "landmark": "Near Roundtana",
    "address_line2": "", "city": "Chennai", "pincode": "600001", "state": "Tamilnadu"
  },
  "delivery_type": "home",
  "notes": "Leave at door",
  "loyalty_points_used": 100
}
// 201
{
  "order_id": "BC-ORD-20260627-0001",
  "subtotal": "2598.00",
  "delivery_charge": "80.00",
  "discount": "100.00",
  "total": "2578.00",
  "razorpay_order_id": "order_xxxxxxxx",
  "razorpay_key_id": "rzp_live_xxxx",
  "amount_in_paise": 257800
}
// 400 if the address isn't deliverable (state resolves to a zone with no active rate, e.g. outside-state delivery switched off)
{ "error": "Delivery is not available for this address" }
```

`shipping_address` is a free-form JSON object (no fixed schema server-side) — `state` drives which delivery zone/price applies (see `docs/DELIVERY.md`); `landmark` and any other address fields are stored as-is and are the frontend's responsibility to collect.

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
  "delivery_charge": "80.00",
  "total": "2678.00",
  "shipping_address": {...},
  "delivery_type": "home",
  "estimated_delivery": "2026-06-30",
  "tracking": { "provider": "Delhivery", "tracking_id": "DLV12345", "url": "https://delhivery.com/track/DLV12345" },
  "refunds": [],
  "notes": "Leave at door",
  "created_at": "2026-06-27T10:00:00Z"
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

### ✅ GET /orders/{id}/track/
```json
{
  "order_id": "BC-ORD-...",
  "status": "shipped",
  "payment_status": "paid",
  "estimated_delivery": "30 Jun 2026",
  "tracking_provider": "Delhivery",
  "tracking_id": "DLV12345",
  "tracking_url": "https://delhivery.com/track/DLV12345",
  "status_history": [
    { "status": "confirmed", "note": "Status changed from pending to confirmed", "created_at": "2026-06-27T10:05:00Z" },
    { "status": "packed", "note": "Status changed from confirmed to packed", "created_at": "2026-06-27T12:00:00Z" },
    { "status": "shipped", "note": "Status changed from packed to shipped", "created_at": "2026-06-28T09:00:00Z" }
  ]
}
```
Status history is automatically logged on every `Order.save()` status change.

### ✅ POST /payment/webhook/
Razorpay webhook with signature verification. Credits loyalty points and sends confirmation email on `payment.captured` event.

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
{ "points": 250, "lifetime_earned": 1200, "lifetime_spent": 950, "expiring_soon": 40, "next_expiry_date": "2027-01-15" }
```
`expiring_soon` is points lapsing within 30 days; `next_expiry_date` is null if nothing is expiring.

### GET /loyalty/transactions/
```json
{
  "results": [
    { "points": 50, "type": "earned", "description": "Welcome bonus", "created_at": "2026-06-15T10:00:00Z", "remaining": 0, "expires_at": "2027-06-15T10:00:00Z" },
    { "points": 12, "type": "earned", "description": "Order BC-ORD-001", "created_at": "2026-06-20T10:00:00Z", "remaining": 12, "expires_at": "2027-06-20T10:00:00Z" }
  ]
}
```

---

## ✅ Delivery

### GET /delivery/check/{pincode}/
```json
// Available (Tamil Nadu pincode)
{ "pincode": "600001", "city": "Chennai", "zone": "tamilnadu", "delivery_available": true, "delivery_type": "local", "estimated_days": "2-4 business days", "store_pickup": true, "cod_available": true, "delivery_charge": null }
// Not available
{ "pincode": "999999", "delivery_available": false, "message": "Delivery not available at this pincode" }
```
Pass `?state=<state>` for an address outside Tamil Nadu — priced via the configurable `OutsideStateDeliveryRate` instead of the pincode table:
```json
// GET /delivery/check/560001/?state=Karnataka
{ "pincode": "560001", "zone": "outside_tamilnadu", "delivery_available": true, "delivery_type": "standard", "estimated_days": "5-8 business days", "store_pickup": false, "cod_available": false, "delivery_charge": "150.00" }
```

---

## ✅ Admin

### POST /admin/orders/{id}/status/
```json
{ "status": "packed" }
// 200 { "status": "packed" }
```
Valid statuses: pending, confirmed, packed, shipped, delivered, cancelled.

### PUT /admin/products/{id}/
```json
{ "name": "Updated Name", "selling_price": "999.00", "total_stock": 25, "is_active": true }
// 200 { "updated": ["name", "selling_price", "total_stock"], "name": "Updated Name" }
```
Allowed fields: name, slug, mrp, selling_price, total_stock, is_active, weight_g, short_description, description, category_id, brand_id, hide_if_out_of_stock.

### POST /admin/refunds/{id}/status/
```json
{ "status": "approved" }
// 200 { "id": 1, "amount": "1299.00", "reason": "Wrong size", "status": "approved", ... }
```
Valid statuses: requested, approved, rejected, processed. Transitioning into `approved` or `processed` for the first time (not on a later re-transition between the two) attempts the Razorpay refund, marks the order `payment_status=refunded`, and reverses any loyalty points earned on that order (Rewards program excludes refunded orders) — `rejected` has no side effects.

---

## Complete Endpoint Table

| # | Method | Path | Auth | Status |
|---|---|---|---|---|
| 1 | POST | /auth/google/ | — | ✅ |
| 2 | POST | /auth/staff/login/ | — | ✅ |
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
| 33 | GET | /orders/{id}/track/ | Bearer | ✅ |
| 34 | POST | /payment/webhook/ | — | ✅ |
| 35 | POST | /admin/orders/{id}/status/ | Bearer | ✅ |
| 36 | PUT | /admin/products/{id}/ | Bearer | ✅ |

* = session-based cart works without auth for guest users
