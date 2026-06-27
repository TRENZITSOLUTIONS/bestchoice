# Product Detail Page — Full Specification

> **Implementation Status**: ✅ = Built · 🚧 = Not yet implemented (spec reference)

## Layout (Top → Bottom)

### 1. Product Header
- Product images gallery ✅ (static, no zoom/carousel yet)
- Product name ✅
- Brand name ✅
- Star rating + review count ✅
- SKU display ✅

### 2. Pricing Section ✅
```
MRP:         ₹1,999
Selling:     ₹1,299
Discount:   35% OFF
GST:        GST Included
```

### 3. Variant Selection ✅
- **Color** — swatch circles, clicking updates available sizes
- **Size** — button group, unavailable sizes disabled
- Changing variant updates: SKU, stock status, price (if override exists)

### 4. Stock Status ✅
| Condition | Display |
|---|---|
| stock > 10 | ✅ In Stock |
| stock ≤ 5 | ⚠ Only X Left |
| stock = 0 | ❌ Out of Stock |

### 5. Product Description ✅
- Short description (1-2 lines)
- Full description (expandable)

### 6. Product Highlights ✅
Bullet list:
```
✔ Premium Cotton
✔ Slim Fit
✔ Soft & Breathable
✔ Comfortable All Day
✔ Wrinkle Resistant
```

### 7. Delivery Information ✅ (partial)
- Delivery info displayed ✅
- Pincode input to check 🚧 (not built — API exists but no UI component)
- Estimated delivery displayed ✅
- Store pickup available ✅

### 8. Return Policy ✅

### 9. Customer Reviews ✅ (partial)
- Average rating display ✅
- Verified reviews list ✅
- "Write a Review" button 🚧 (not built — API exists)

### 10. Related Products ✅ (basic)

### 11. Action Buttons ✅
- **Add to Cart** ✅
- **Buy Now** ✅
- **Wishlist ❤️** ✅
- **Share Product** ✅ (copy link)
- **WhatsApp Enquiry** ✅ (wa.me link)
- **Sticky bottom on mobile** 🚧 (not built)

---

## Functional Requirements

### Product ID & SKU
- Auto-generate Product ID on creation (format: `BC-{category_code}-{6digit}`)
- Each variant gets unique SKU (format: `BC-{product_id}-{COLOR}-{SIZE}`)
- SKU is unique across system

### Stock Management
- On order placement → stock deducted from variant
- On order cancellation → stock restored
- Products with total_stock = 0 are hidden if `hide_if_out_of_stock` is enabled

### Search
- Searchable fields: name, SKU, category name, brand name
- Case-insensitive partial match
- Combined with filters

### Filters (Product Listing)
| Filter | Type |
|---|---|
| Category | Dropdown / sidebar |
| Price Range | Slider or min/max inputs |
| Color | Swatches |
| Size | Buttons |
| Brand | Checkboxes |
| Discount | Preset: 10%, 20%, 30%, 50%+ |

### Admin Features
- Duplicate product (copies: product, variants, images, highlights, related)
- Bulk upload via Excel/CSV with columns:
  - name, category, brand, mrp, selling_price, short_description, description, color, size, stock, images (comma-separated URLs or local paths)

### Performance
- Server-side render (SSR) product page 🚧 (currently CSR)
- Images lazy-loaded with blur placeholder 🚧
- Pre-generated thumbnails from S3 🚧
- Cache product API response (Redis, 5min TTL) 🚧
- Mobile-first responsive design ✅

---

## Component Tree

```
ProductDetailPage (SSR)
├── Breadcrumb
├── ProductGallery
│   ├── MainImage (zoom on hover)
│   └── ThumbnailStrip
├── ProductInfo
│   ├── ProductName
│   ├── BrandBadge
│   ├── StarRating + ReviewCount
│   ├── SKUDisplay
│   ├── PriceDisplay (MRP, selling, discount %)
│   ├── GSTLabel
│   ├── VariantSelector
│   │   ├── ColorSwatches
│   │   └── SizeButtons
│   ├── StockBadge
│   └── ActionButtons (AddToCart, BuyNow, Wishlist, Share, WhatsApp)
├── ProductDescription
│   ├── ShortDescription
│   └── FullDescription (expandable)
├── ProductHighlights
├── DeliveryInfo
│   ├── PincodeChecker
│   ├── DeliveryEstimate
│   └── PickupAvailability
├── ReturnPolicy
├── ReviewSection
│   ├── AverageRatingCard
│   ├── ReviewList
│   │   └── ReviewCard (user, rating, text, images, verified badge)
│   └── WriteReviewButton → Modal
└── RelatedProducts
    ├── SimilarProducts (carousel)
    ├── FrequentlyBought (grid)
    └── Recommended (carousel)
```

## Mobile Considerations 🚧

- Sticky bottom bar 🚧
- Gallery: swipeable, pinch-to-zoom 🚧
- Variant selector: horizontal scroll ✅
- Filters: slide-in drawer 🚧
- Share: native share API 🚧
