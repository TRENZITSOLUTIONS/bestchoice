import Link from 'next/link';
import Image from 'next/image';

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Shop',
    links: [
      { href: '/products?category=mens-wear', label: "Men's Wear" },
      { href: '/products?category=womens-wear', label: "Women's Wear" },
      { href: '/products?category=kids-wear', label: "Kids' Wear" },
      { href: '/products?category=cosmetics', label: 'Cosmetics' },
      { href: '/products?category=mobile-accessories', label: 'Mobile Accessories' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { href: '/account/orders', label: 'Track Order' },
      { href: '/refund-policy', label: 'Returns & Refunds' },
      { href: '/shipping-policy', label: 'Shipping Policy' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/account/loyalty', label: 'Best Choice Rewards' },
      { href: '/terms', label: 'Terms & Conditions' },
      { href: '/privacy', label: 'Privacy Policy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-sunken pt-18 pb-8">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <div className="mb-12 grid gap-11 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/logo-crest.png"
              alt="Best Choice"
              width={700}
              height={885}
              className="mb-4 h-24 w-auto"
            />
            <p className="max-w-[250px] text-[0.83rem] leading-relaxed text-ink-faint">
              Spencer Plaza Branch, Chennai. Clothing, cosmetics &amp; accessories, delivered across
              Tamil Nadu.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-4.5 text-[0.64rem] font-bold uppercase tracking-[0.22em] text-marigold">
                {col.heading}
              </h4>
              <ul className="grid list-none gap-2.5 p-0 m-0">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-[0.86rem] text-ink-soft transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-7 text-[0.75rem] text-ink-faint">
          <span>© {new Date().getFullYear()} Best Choice Clothing</span>
          <span>UPI · Cards · Netbanking via Razorpay</span>
        </div>
      </div>
    </footer>
  );
}
