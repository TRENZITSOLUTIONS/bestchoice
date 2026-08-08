'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useProducts';
import { CategoryGlyph, GLYPH_WASH, glyphFor } from '@/components/CategoryGlyph';

const CATEGORY_BLURBS: Record<string, string> = {
  'mens-wear': 'Shirts · Denim · Ethnic',
  'womens-wear': 'Sarees · Kurtis · Dresses',
  'kids-wear': 'Boys · Girls · Baby',
  cosmetics: 'Makeup · Skincare · Scent',
  'mobile-accessories': 'Audio · Charge · Protect',
};

const TRENDING = [
  'Cotton shirts',
  'Banarasi sarees',
  'Matte lipstick',
  '65W chargers',
  'Kids ethnic',
  'Smart watches',
];

const INTRO_VIDEO_URL = '/intro-video.mp4';

export default function HomePage() {
  const { data: categories } = useCategories();
  const router = useRouter();
  const [query, setQuery] = useState('');

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  }

  return (
    <div>
      {/* ---------- Intro video ---------- */}
      <section className="relative overflow-hidden border-b border-line bg-[#0a0a0c]">
        <span aria-hidden className="band-shimmer pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Meet Best Choice</p>
            <h2 className="display text-[2rem] sm:text-[3rem] mt-4 mb-5">
              See how <em className="italic text-marigold-lit">we</em> do it.
            </h2>
            <p className="max-w-[400px] leading-relaxed text-ink-soft">
              A quick look inside our Spencer Plaza counter, and how every order finds its way to
              your door.
            </p>
          </div>
          <IntroVideo />
        </div>
      </section>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line py-24 sm:py-32">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-[10%] -top-[30%] w-3/5 h-[160%]"
          style={{
            background: 'radial-gradient(closest-side, rgba(224,38,28,0.13), transparent 70%)',
          }}
        />
        <Image
          src="/logo-crest.png"
          alt=""
          width={700}
          height={885}
          aria-hidden
          priority
          className="crest-breathe pointer-events-none absolute -right-10 top-1/2 hidden w-[560px] max-w-none -translate-y-1/2 opacity-[0.085] lg:block"
        />

        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-8">
          <div className="max-w-[700px]">
            <p className="eyebrow">Spencer Plaza · Chennai · For Tamil Nadu</p>
            <h1 className="display text-[2.6rem] sm:text-[3.4rem] lg:text-[4.4rem] mt-5">
              Dressed right,
              <br />
              <em className="italic text-marigold-lit">delivered right.</em>
            </h1>
            <div className="my-7 h-px w-[260px] bg-gradient-to-r from-marigold to-transparent" />
            <p className="text-ink-soft text-base sm:text-[1.05rem] leading-relaxed max-w-[470px] mb-9">
              Five departments under one roof — menswear to mobile accessories — carried to your
              doorstep across Tamil Nadu, or held for pickup at our Chennai counter.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/products?ordering=-created_at"
                className="inline-flex items-center gap-3 bg-kumkum hover:bg-kumkum-deep text-white text-[0.76rem] font-extrabold uppercase tracking-[0.16em] px-8 py-4 transition-all hover:-translate-y-0.5 shadow-[0_14px_40px_-14px_rgba(224,38,28,0.7)]"
              >
                Shop new arrivals
              </Link>
              <Link
                href="/products?discount=20"
                className="text-[0.74rem] font-bold uppercase tracking-[0.16em] text-ink hover:text-marigold-lit border-b border-marigold pb-1 transition-colors"
              >
                Festive edit · up to 40% off
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Search ---------- */}
      <section className="border-b border-line bg-card/40 py-14">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
          <div className="text-center mb-7">
            <p className="eyebrow">Find it fast</p>
            <h2 className="display text-2xl sm:text-[1.9rem] mt-3">What are you looking for?</h2>
          </div>
          <form
            onSubmit={submitSearch}
            className="mx-auto flex max-w-[720px] items-center gap-3 border border-line bg-ivory pl-5 pr-1.5 py-1.5 transition focus-within:border-marigold focus-within:ring-4 focus-within:ring-marigold/10"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden
              className="shrink-0 text-marigold"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M16.5 16.5L21 21" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shirts, sarees, lipsticks, chargers…"
              aria-label="Search products"
              className="flex-1 bg-transparent border-0 outline-none text-ink placeholder:text-ink-faint py-3.5"
            />
            <button
              type="submit"
              className="bg-ink text-ivory hover:bg-marigold-lit text-[0.72rem] font-extrabold uppercase tracking-[0.16em] px-6 py-3.5 transition-colors"
            >
              Search
            </button>
          </form>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {TRENDING.map((t) => (
              <Link
                key={t}
                href={`/products?search=${encodeURIComponent(t)}`}
                className="rounded-full border border-line px-4 py-1.5 text-[0.74rem] text-ink-soft transition-colors hover:border-marigold-lit hover:bg-marigold-lit hover:text-ivory"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        {/* ---------- Department mosaic ---------- */}
        <section className="py-16 sm:py-22">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">The departments</p>
              <h2 className="display text-2xl sm:text-[2.4rem] mt-3">Five worlds, one counter.</h2>
            </div>
            <p className="max-w-[380px] text-[0.94rem] leading-relaxed text-ink-soft">
              Everything the household needs, stocked the way a neighbourhood store should — and
              shipped like a modern one.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr] lg:grid-rows-2 lg:h-[520px]">
            {categories?.map((cat, i) => {
              const glyph = glyphFor(cat.name);
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={`group relative flex min-h-[210px] flex-col justify-end overflow-hidden border border-line p-6 transition-all duration-300 hover:border-marigold hover:-translate-y-1 ${
                    i === 0 ? 'lg:row-span-2' : ''
                  }`}
                  style={{ background: GLYPH_WASH[glyph] }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(120% 90% at 70% 10%, rgba(255,255,255,0.07), transparent 62%)',
                    }}
                  />
                  <span className="absolute right-5 top-5 text-ink/50 transition-all duration-500 group-hover:text-ink/95 group-hover:-translate-y-1">
                    <CategoryGlyph glyph={glyph} size={i === 0 ? 54 : 40} />
                  </span>
                  <span
                    className={`relative font-serif text-ink ${i === 0 ? 'text-[2rem]' : 'text-[1.45rem]'}`}
                  >
                    {cat.name}
                  </span>
                  <span className="relative mt-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-marigold-lit">
                    {CATEGORY_BLURBS[cat.slug] ?? `${cat.product_count} items`}
                  </span>
                  <span className="relative mt-4 h-px w-8 bg-marigold transition-all duration-300 group-hover:w-20" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* ---------- Rewards ---------- */}
      <section className="border-y border-line bg-card/40 py-20">
        <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-4 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="eyebrow">Best Choice Rewards</p>
            <h2 className="display text-[1.9rem] sm:text-[2.5rem] mt-4 mb-5">
              Every rupee spent comes back to you.
            </h2>
            <p className="mb-7 max-w-[400px] leading-relaxed text-ink-soft">
              Points on every paid order, redeemable against the next one. No card, no fee — it
              starts the first time you sign in.
            </p>
            <Link
              href="/account/loyalty"
              className="border-b border-marigold pb-1 text-[0.74rem] font-bold uppercase tracking-[0.16em] text-ink hover:text-marigold-lit"
            >
              See the programme
            </Link>
          </div>
          <div className="grid gap-px bg-line border border-line">
            <RewardStep n="01" title="Earn as you shop" body="One point for every ₹100 on paid orders, credited once payment clears." />
            <RewardStep n="02" title="Redeem at checkout" body="Each point is worth ₹1 off, up to a fifth of any single order." />
            <RewardStep n="03" title="Keep them a year" body="Points stay valid 365 days from the day they land." />
          </div>
        </div>
      </section>

      {/* ---------- Trust ---------- */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8 py-16">
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          <TrustItem title="Tamil Nadu delivery" body="2–4 business days statewide">
            <path d="M2 7h11v9H2zM13 10h5l3 3v3h-8z" />
            <circle cx="6" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
          </TrustItem>
          <TrustItem title="Store pickup" body="Collect free at Spencer Plaza">
            <path d="M3 21V9l9-6 9 6v12" />
            <path d="M9 21v-7h6v7" />
          </TrustItem>
          <TrustItem title="7-day returns" body="Unused, with tags intact">
            <path d="M3 10h13a5 5 0 0 1 0 10H8" />
            <path d="M7 6l-4 4 4 4" />
          </TrustItem>
          <TrustItem title="Secure payments" body="UPI, cards & netbanking via Razorpay">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10.5h18" />
          </TrustItem>
        </div>
      </div>
    </div>
  );
}

/** Click-to-play, not autoplay: nothing (no video bytes, no player) loads
 *  over the wire until someone actually asks to watch it. */
function IntroVideo() {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <video
        className="aspect-video w-full border border-line bg-black"
        autoPlay
        playsInline
        onEnded={() => setPlaying(false)}
        src={INTRO_VIDEO_URL}
      />
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      aria-label="Play introduction video"
      className="group relative flex aspect-video w-full items-center justify-center overflow-hidden border border-line bg-sunken"
    >
      <span aria-hidden className="absolute inset-[10%] rounded-full border border-line" />
      <span aria-hidden className="absolute inset-[24%] rounded-full border border-marigold/25" />
      <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-kumkum text-white shadow-[0_14px_40px_-14px_rgba(224,38,28,0.7)] transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}

function RewardStep({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex items-baseline gap-5 bg-ivory-raised px-6 py-6">
      <span className="font-serif text-[1.9rem] leading-none text-marigold num min-w-[52px]">{n}</span>
      <div>
        <h3 className="font-bold text-[0.94rem] mb-1">{title}</h3>
        <p className="text-[0.82rem] leading-relaxed text-ink-faint m-0">{body}</p>
      </div>
    </div>
  );
}

function TrustItem({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ivory px-6 py-7">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="mb-3.5 text-marigold"
      >
        {children}
      </svg>
      <h3 className="font-bold text-[0.88rem] mb-1">{title}</h3>
      <p className="text-[0.79rem] leading-relaxed text-ink-faint m-0">{body}</p>
    </div>
  );
}
