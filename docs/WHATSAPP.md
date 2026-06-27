# WhatsApp Integration

## Use Cases

1. **Product Enquiry** — Customer clicks "WhatsApp Enquiry" on product page → opens WhatsApp with pre-filled message containing product name + URL
2. **Order Confirmation** — WhatsApp notification when order is placed
3. **Order Updates** — Status change notifications (packed, shipped, delivered)
4. **Refund Update** — Refund processed notification

## Implementation

### Option A: WhatsApp Click-to-Chat (Free, No API needed)
- Use `wa.me` links with pre-filled text:
```
https://wa.me/919876543210?text=Hi%2C%20I%27m%20interested%20in%20Premium%20Cotton%20Shirt%20-%20https%3A%2F%2Fbestchoice.in%2Fproducts%2Fpremium-cotton-shirt
```
- Add a business WhatsApp number
- Customer support team replies manually

### Option B: WhatsApp Business API (For automation)
- Use provider like **Twilio** or **WATI** or **Interakt**
- Send automated order notifications
- Requires Meta approval (for business)

### Recommended for MVP
Start with **Option A (wa.me links)** — zero cost, immediate setup.
Add WhatsApp Business API later for automated notifications.

## Frontend Component

```tsx
// components/WhatsAppButton.tsx
const WhatsAppButton = ({ productName, productUrl }: Props) => {
  const message = encodeURIComponent(
    `Hi, I'm interested in ${productName} - ${productUrl}`
  );
  return (
    <a
      href={`https://wa.me/919876543210?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-btn"
    >
      <WhatsAppIcon /> WhatsApp Enquiry
    </a>
  );
};
```
