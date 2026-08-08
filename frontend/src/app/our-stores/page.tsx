import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Stores — Best Choice',
  description:
    'Visit Best Choice in person at our Spencer Plaza and Perambur stores in Chennai — addresses, maps and directions.',
};

interface Store {
  name: string;
  addressLines: string[];
  phone?: string;
  lat: number;
  lng: number;
}

const STORES: Store[] = [
  {
    name: 'Spencer Plaza',
    addressLines: [
      '45, Spencer Plaza Mall, Floor 1',
      'Anna Salai, Chennai, Tamil Nadu 600002',
    ],
    phone: '088256 25123',
    lat: 13.0613754,
    lng: 80.2608414,
  },
  {
    name: 'Perambur',
    addressLines: [
      '74/2, Paper Mills Rd, Bunder Garden',
      'Perambur, Chennai, Tamil Nadu 600011',
    ],
    lat: 13.1131289,
    lng: 80.2359321,
  },
];

export default function OurStoresPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-10 sm:py-14">
      <p className="eyebrow">Visit us</p>
      <h1 className="display text-3xl sm:text-4xl mt-2">Our Stores</h1>
      <p className="mt-4 max-w-[65ch] text-ink-soft leading-relaxed">
        Prefer to shop in person, try something on, or collect an order yourself? Come by
        either of our two stores in Chennai.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {STORES.map((store) => (
          <article key={store.name} className="border border-line bg-card">
            <iframe
              title={`Map to Best Choice, ${store.name}`}
              src={`https://www.google.com/maps?q=${store.lat},${store.lng}&z=16&output=embed`}
              className="h-64 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-5 sm:p-6">
              <h2 className="display text-lg sm:text-xl">Best Choice — {store.name}</h2>
              <address className="mt-2 not-italic text-ink-soft leading-relaxed">
                {store.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              {store.phone && (
                <p className="mt-2 text-ink-soft">
                  <a href={`tel:${store.phone.replace(/\s+/g, '')}`} className="hover:text-ink">
                    {store.phone}
                  </a>
                </p>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-bold text-kumkum-deep hover:text-kumkum"
              >
                Get directions →
              </a>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-10 text-sm text-ink-faint">
        You can also choose <span className="font-semibold text-ink">Store pickup</span> at
        checkout to collect an online order from the Spencer Plaza store — see our{' '}
        <a href="/shipping-policy" className="font-semibold text-kumkum-deep hover:text-kumkum">
          Shipping Policy
        </a>{' '}
        for details.
      </p>
    </div>
  );
}
