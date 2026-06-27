# BestChoice E-Commerce — Agent Memory

## Project Overview
Full-stack e-commerce platform for clothing & cosmetics. Serves Tamilnadu with home delivery + store pickup.

## Tech Stack
- **Backend:** Django + DRF + PostgreSQL
- **Frontend:** Next.js (SSR) + TailwindCSS + React Query + Zustand
- **Images:** AWS S3 + CloudFront CDN (4 sizes auto-generated on upload)
- **Payment:** Razorpay
- **Auth:** Simple JWT
- **Cache:** Redis
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
├── PLAN.md                  # Master plan
├── AGENTS.md                # This file — session memory
├── docs/
│   ├── PRODUCT-PAGE.md      # Product detail page full spec
│   ├── API-SPECS.md         # All API endpoints with examples
│   ├── ADMIN.md             # Django admin + custom dashboard
│   ├── DELIVERY.md          # Tamilnadu delivery & logistics
│   ├── LOYALTY.md           # Loyalty points system
│   ├── WHATSAPP.md          # WhatsApp integration
│   ├── INVENTORY-SETUP.md   # Inventory flow, SKU format, bulk upload
│   └── COUPONS.md           # Coupon codes system
├── backend/                 # Django project (to be built)
└── frontend/                # Next.js project (to be built)
```

## Category Hierarchy
- Men's Wear → Shirts, T-Shirts, Jeans, Trousers, Blazers, Ethnic Wear
- Women's Wear → Sarees, Kurtis, Dresses, Tops
- Kids Wear
- Cosmetics

## Inventory Flow
```
Supplier → Receive → SKU Created → Upload to Site → Customer Orders
→ Auto Stock Deduct → Packing → Shipping/Store Pickup
```
Cancellation restores stock. Zero-stock products hidden if configured.

## Product Detail Page Layout (Top→Bottom)
Header (gallery/name/brand/rating/SKU) → Pricing (MRP/selling/discount%/GST)
→ Variant (color/size) → Stock → Description (short+full) → Highlights
→ Delivery (pincode/same-day/pickup) → Return Policy → Reviews
→ Related Products → Action Buttons (cart/buy/wishlist/share/WhatsApp)

## Build Phases
| Phase | What | Status |
|---|---|---|
| 1 | Django setup + PostgreSQL + DRF | Pending |
| 2 | Core models (User, Category, Product, Variant) | Pending |
| 3 | DRF API endpoints | Pending |
| 4 | Next.js frontend scaffolding | Pending |
| 5 | Product listing + detail page | Pending |
| 6 | Cart, checkout, Razorpay | Pending |
| 7 | Orders, tracking, refunds, loyalty | Pending |
| 8 | Reviews, wishlist, coupons | Pending |
| 9 | Admin dashboard (custom) | Pending |
| 10 | WhatsApp (separate app), delivery, polish, deploy | Pending |

## Commit Rules
- Commit **frequently** — after every logical unit of work (e.g., "added Product model", "added GET /products/ endpoint", "built ProductCard component").
- Each commit must contain **only related changes** — no mixing unrelated work in one commit.
- This ensures we can **revert to specific points** without losing unrelated progress.
- Example good commits: "Added Category model with admin", "Added ProductVariant model", "Built product listing API with filters".
- Example bad commit: "Added models, APIs, frontend components, and fixed bugs" (too large, mixed concerns).

## All Requirements Covered
All requirements from the user are documented in the 8 docs. See docs/ for full specs. Nothing pending from requirements — ready to start building.
