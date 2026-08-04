import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-ivory-raised py-12 text-sm text-ink-soft">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-7">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <div className="text-lg font-extrabold tracking-tight text-ink">
              Best<span className="text-kumkum">Choice</span>
            </div>
            <p className="mt-2.5 max-w-[240px]">
              Spencer Plaza Branch, Chennai. Clothing, cosmetics &amp; accessories delivered across Tamil Nadu.
            </p>
          </div>
          <div>
            <h4 className="text-xs tracking-wide uppercase text-ink mb-3.5">Shop</h4>
            <ul className="grid gap-2">
              <li><Link href="/products?category=mens-wear">Men&apos;s Wear</Link></li>
              <li><Link href="/products?category=womens-wear">Women&apos;s Wear</Link></li>
              <li><Link href="/products?category=kids-wear">Kids&apos; Wear</Link></li>
              <li><Link href="/products?category=cosmetics">Cosmetics</Link></li>
              <li><Link href="/products?category=mobile-accessories">Mobile Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs tracking-wide uppercase text-ink mb-3.5">Help</h4>
            <ul className="grid gap-2">
              <li><Link href="/account/orders">Track Order</Link></li>
              <li><Link href="/refund-policy">Returns &amp; Refunds</Link></li>
              <li><Link href="/shipping-policy">Shipping Policy</Link></li>
              <li><Link href="/">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs tracking-wide uppercase text-ink mb-3.5">Company</h4>
            <ul className="grid gap-2">
              <li><Link href="/">About Us</Link></li>
              <li><Link href="/account/loyalty">Best Choice Rewards</Link></li>
              <li><Link href="/terms">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-9 pt-5 border-t border-line flex flex-wrap justify-between gap-2.5">
          <span>&copy; {new Date().getFullYear()} Best Choice Clothing</span>
          <span>UPI &middot; Cards &middot; Netbanking via Razorpay</span>
        </div>
      </div>
    </footer>
  );
}
