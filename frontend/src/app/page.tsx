'use client';

import Link from 'next/link';
import { useCategories, useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard';

const CATEGORY_BLURBS: Record<string, string> = {
  'mens-wear': "Shirts · Jeans · Ethnic",
  'womens-wear': 'Sarees · Kurtis · Dresses',
  'kids-wear': 'Boys · Girls · Baby',
  cosmetics: 'Makeup · Skincare',
  'mobile-accessories': 'Chargers · Earphones',
};

export default function HomePage() {
  const { data: categories } = useCategories();
  const { data: featured } = useProducts({ discount: '20', ordering: '-created_at' });
  const { data: newArrivals } = useProducts({ ordering: '-created_at' });

  return (
    <div>
      <div className="grid sm:grid-cols-[1.1fr_0.9fr] border-b border-line">
        <div className="px-4 sm:px-7 py-14 sm:py-18 max-w-[560px]">
          <p className="eyebrow">Spencer Plaza · Chennai · Est. for Tamil Nadu</p>
          <h1 className="display text-4xl sm:text-5xl leading-[0.98] mt-3.5 mb-5">
            Dressed right, delivered right.
          </h1>
          <p className="text-lg text-ink-soft max-w-[440px] mb-7">
            Clothing, cosmetics and accessories for every member of the house — delivered to your
            doorstep across Tamil Nadu, or collect free from our Chennai store.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm px-6.5 py-3.5 rounded"
          >
            Shop the new arrivals →
          </Link>
        </div>
        <div
          className="relative min-h-[280px] sm:min-h-0"
          style={{
            background: 'linear-gradient(155deg, var(--kumkum) 0%, var(--kumkum) 42%, var(--marigold) 100%)',
            clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 0% 100%)',
          }}
        >
          <span className="absolute left-8 bottom-8 text-white text-xs font-bold tracking-wide uppercase bg-ink/35 px-3.5 py-2 rounded">
            Festive Edit · Up to 40% off
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 sm:px-7">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-line border-b border-line mt-10 -mx-4 sm:mx-0">
          {categories?.map((cat) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`} className="bg-ivory p-5 text-center">
              <div
                className="w-full aspect-[4/3] rounded-sm mb-3.5"
                style={{ background: 'linear-gradient(135deg, var(--kumkum), var(--marigold))' }}
              />
              <h3 className="text-sm font-semibold">{cat.name}</h3>
              <span className="text-xs text-ink-soft">{CATEGORY_BLURBS[cat.slug] ?? `${cat.product_count} items`}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-baseline justify-between mt-14 mb-5.5">
          <div>
            <p className="eyebrow">Handpicked</p>
            <h2 className="display text-2xl mt-1.5">Featured this week</h2>
          </div>
          <Link href="/products?discount=20" className="text-sm font-bold text-kumkum-deep">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5.5">
          {featured?.results.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} span2={i === 0} />
          ))}
        </div>

        <div className="mt-12 bg-ink text-ivory p-7.5 rounded-md flex items-center justify-between gap-5 flex-wrap">
          <div>
            <p className="eyebrow text-marigold">Best Choice Rewards</p>
            <h3 className="display text-xl mt-1.5">Earn on every order, redeem at checkout</h3>
          </div>
          <div className="text-right">
            <div className="text-marigold font-extrabold text-3xl num">1 pt / ₹100</div>
            <div className="text-xs opacity-70">100 pts = ₹100 off · valid 12 months</div>
          </div>
        </div>

        <div className="flex items-baseline justify-between mt-14 mb-5.5">
          <div>
            <p className="eyebrow">Shop by category</p>
            <h2 className="display text-2xl mt-1.5">New arrivals</h2>
          </div>
          <Link href="/products?ordering=-created_at" className="text-sm font-bold text-kumkum-deep">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5.5 pb-14">
          {newArrivals?.results.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="border-t border-b border-line py-8 grid sm:grid-cols-4 gap-6">
          <TrustItem icon="🚚" title="Tamil Nadu delivery" body="2-4 business days statewide" />
          <TrustItem icon="🏬" title="Store pickup" body="Collect free at Spencer Plaza" />
          <TrustItem icon="↩" title="7-day returns" body="Easy exchange on eligible items" />
          <TrustItem icon="🔒" title="Secure payments" body="UPI, cards & netbanking via Razorpay" />
        </div>
      </div>
    </div>
  );
}

function TrustItem({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-9.5 h-9.5 rounded-sm bg-ivory-raised flex items-center justify-center flex-shrink-0 text-lg">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-0.5">{title}</h4>
        <p className="text-xs text-ink-soft m-0">{body}</p>
      </div>
    </div>
  );
}
