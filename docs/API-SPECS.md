# API Specifications

## Base URL
- Development: `http://localhost:8000/api/`
- Production: `https://api.bestchoice.in/api/`

## Authentication
- JWT Bearer token in `Authorization` header
- Obtain: `POST /auth/login/`
- Refresh: `POST /auth/token/refresh/`

---

## Auth Endpoints

### POST /auth/register/
```json
{
  "email": "user@example.com",
  "phone": "9876543210",
  "password": "securepass123",
  "first_name": "John",
  "last_name": "Doe"
}
// Response: 201
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": "9876543210",
  "access": "jwt_token",
  "refresh": "refresh_token"
}
```

### POST /auth/login/
```json
{ "email": "user@example.com", "password": "securepass123" }
// Response: 200 { "access": "...", "refresh": "...", "user": {...} }
```

### POST /auth/otp/
```json
{ "phone": "9876543210" }
// Response: 200 { "message": "OTP sent", "otp_length": 6 }
```

### POST /auth/otp/verify/
```json
{ "phone": "9876543210", "otp": "123456" }
// Response: 200 { "access": "...", "refresh": "...", "is_new_user": false }
```

### GET /auth/me/
```
Headers: Authorization: Bearer <token>
Response: 200
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": "9876543210",
  "first_name": "John",
  "last_name": "Doe",
  "loyalty_points": 250,
  "default_address": {...}
}
```

---

## Products

### GET /products/
**Query Params:**
| Param | Type | Description |
|---|---|---|
| search | string | Search name, SKU, brand, category |
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
  "next": "?page=3",
  "previous": null,
  "results": [
    {
      "id": 1,
      "product_id": "BC-SHT-000001",
      "name": "Premium Cotton Shirt",
      "slug": "premium-cotton-shirt",
      "category": { "name": "Shirts", "slug": "shirts" },
      "brand": { "name": "BestChoice", "slug": "bestchoice" },
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
    "id": 5,
    "name": "Shirts",
    "slug": "shirts",
    "parent": { "id": 1, "name": "Men's Wear", "slug": "mens-wear" }
  },
  "brand": { "id": 1, "name": "BestChoice", "slug": "bestchoice", "logo": "..." },
  "images": [
    { "id": 1, "thumb": "cdn.url/thumb/001.jpg", "small": "cdn.url/small/001.jpg", "medium": "cdn.url/medium/001.jpg", "large": "cdn.url/large/001.jpg", "alt": "Front view", "is_primary": true },
    { "id": 2, "thumb": "cdn.url/thumb/002.jpg", "small": "cdn.url/small/002.jpg", "medium": "cdn.url/medium/002.jpg", "large": "cdn.url/large/002.jpg", "alt": "Back view", "is_primary": false }
  ],
  "variants": [
    { "id": 10, "color": "Red", "size": "M", "sku": "BC-SHT-000001-RED-M", "stock": 12, "price": null },
    { "id": 11, "color": "Red", "size": "L", "sku": "BC-SHT-000001-RED-L", "stock": 0, "price": null },
    { "id": 12, "color": "Blue", "size": "M", "sku": "BC-SHT-000001-BLUE-M", "stock": 5, "price": null }
  ],
  "available_colors": ["Red", "Blue"],
  "available_sizes": ["M", "L", "XL"],
  "highlights": [
    "Premium Cotton",
    "Slim Fit",
    "Soft & Breathable"
  ],
  "pricing": {
    "mrp": "1999.00",
    "selling_price": "1299.00",
    "discount_percent": 35,
    "gst_included": true
  },
  "stock_status": {
    "total_stock": 17,
    "badge": "in_stock",
    "label": "In Stock"
  },
  "delivery": {
    "same_day_chennai": true,
    "tamilnadu_days": "2-3",
    "store_pickup": true,
    "pincode_check": null
  },
  "return_policy": {
    "exchange_days": 7,
    "size_replacement": true
  },
  "rating": {
    "average": 4.3,
    "count": 28,
    "distribution": { "5": 15, "4": 8, "3": 3, "2": 1, "1": 1 }
  },
  "related": {
    "similar": [...],
    "frequently_bought": [...],
    "recommended": [...]
  },
  "created_at": "2026-06-01T10:00:00Z"
}
```

### GET /categories/
```json
[
  {
    "id": 1,
    "name": "Men's Wear",
    "slug": "mens-wear",
    "image": "cdn.url/categories/mens.jpg",
    "children": [
      { "id": 2, "name": "Shirts", "slug": "shirts", "product_count": 45 },
      { "id": 3, "name": "T-Shirts", "slug": "tshirts", "product_count": 60 }
    ]
  }
]
```

---

## Cart

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
      "unit_price": "1299.00",
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
// Response: 201 { "id": 1, "quantity": 1, "total_price": "1299.00" }
```

### POST /cart/apply-coupon/
```json
{ "code": "WELCOME20" }
// Response: 200 { "discount": "259.80", "total": "2338.20", "coupon": { "code": "WELCOME20", "discount_percent": 20 } }
```

---

## Checkout & Orders

### POST /checkout/
```json
{
  "shipping_address": {
    "full_name": "John Doe",
    "phone": "9876543210",
    "address_line1": "123, Anna Nagar",
    "address_line2": "",
    "city": "Chennai",
    "pincode": "600001",
    "state": "Tamilnadu"
  },
  "delivery_type": "home",
  "notes": "Leave at door"
}
// Response: 201
{
  "order_id": "BC-ORD-20260627-0001",
  "total": "2598.00",
  "razorpay_order_id": "order_xxxxxxxx",
  "razorpay_key_id": "rzp_live_xxxx",
  "amount_in_paise": 259800
}
```

### POST /orders/{id}/cancel/
```json
{ "reason": "Changed my mind" }
// Response: 200 { "status": "cancelled", "refund_status": "pending" }
```

### GET /orders/{id}/
```json
{
  "order_id": "BC-ORD-20260627-0001",
  "status": "shipped",
  "payment_status": "paid",
  "items": [...],
  "total": "2598.00",
  "shipping_address": {...},
  "delivery_type": "home",
  "estimated_delivery": "2026-06-30",
  "tracking": {
    "provider": "Delhivery",
    "tracking_id": "DH-123456789",
    "url": "https://delhivery.com/track/DH-123456789",
    "updates": [
      { "status": "Picked Up", "location": "Chennai", "timestamp": "2026-06-27T14:00:00Z" },
      { "status": "In Transit", "location": "Hubli", "timestamp": "2026-06-28T10:00:00Z" }
    ]
  },
  "refund": null
}
```

---

## Reviews

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
      "images": ["cdn.url/review/1.jpg"],
      "is_verified_purchase": true,
      "created_at": "2026-06-20T10:00:00Z"
    }
  ]
}
```

### POST /products/{slug}/reviews/
```json
{ "rating": 5, "text": "Great product!", "images": [] }
// Response: 201 { ...review }
```

---

## Error Format
```json
{
  "error": true,
  "message": "Product not found",
  "code": "NOT_FOUND",
  "status": 404
}
```

## Validation Errors
```json
{
  "error": true,
  "message": "Validation failed",
  "fields": {
    "email": ["Enter a valid email address."],
    "password": ["This field is required."]
  },
  "status": 400
}
```
