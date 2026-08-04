'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cart';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth';
import { AnnouncementTicker } from './AnnouncementTicker';

export function Header() {
  const { data: categories } = useCategories();
  useCart(); // keeps the cart store warm so the bag count is accurate everywhere
  const itemCount = useCartStore((s) => s.itemCount());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Staff browsing the storefront don't need shopping chrome - a manager
  // checking a product page has no use for a wishlist or a bag.
  const isStaff = Boolean(user?.is_staff);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/products?search=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <AnnouncementTicker />

      <header className="sticky top-0 z-40 border-b border-line bg-ivory/85 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
          <div className="flex items-center gap-4 lg:gap-9 py-3.5">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image
                src="/logo-mark.png"
                alt=""
                width={36}
                height={37}
                priority
                className="h-7 w-auto sm:h-8"
              />
              <span className="font-serif text-xl sm:text-[1.42rem] text-ink">
                Best<span className="text-kumkum">Choice</span>
              </span>
            </Link>

            <nav className="hidden lg:flex gap-0.5">
              {categories?.map((cat) => (
                <div key={cat.id} className="relative group">
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="block whitespace-nowrap px-3 py-2.5 text-[0.76rem] font-semibold uppercase tracking-[0.05em] text-ink-soft hover:text-ink transition-colors"
                  >
                    {cat.name}
                  </Link>
                  <span className="pointer-events-none absolute left-3.5 right-3.5 bottom-1.5 h-px origin-left scale-x-0 bg-marigold transition-transform duration-300 group-hover:scale-x-100" />
                  {cat.children.length > 0 && (
                    <div className="hidden group-hover:block absolute top-full left-0 pt-2 z-50">
                      <div className="bg-card border border-line p-4 min-w-[200px] grid gap-0.5 shadow-2xl shadow-black/60">
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/products?category=${child.slug}`}
                            className="text-[0.82rem] px-2.5 py-2 whitespace-nowrap text-ink-soft hover:text-marigold-lit hover:bg-ivory-raised transition-colors"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-4 sm:gap-6">
              <form onSubmit={submitSearch} className="hidden md:block">
                <input
                  name="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  aria-label="Search products"
                  className="w-36 lg:w-48 bg-card border border-line px-3.5 py-2 text-[0.82rem] text-ink placeholder:text-ink-faint outline-none focus:border-marigold focus:ring-4 focus:ring-marigold/10 transition"
                />
              </form>

              {isStaff && (
                <Link
                  href="/staff"
                  className="hidden sm:inline text-[0.72rem] font-bold uppercase tracking-[0.13em] text-marigold-lit hover:text-marigold"
                >
                  Manage
                </Link>
              )}

              <Link
                href={isAuthenticated ? '/account' : '/auth/login'}
                className="text-[0.72rem] font-bold uppercase tracking-[0.13em] text-ink hover:text-marigold-lit"
              >
                Account
              </Link>

              {!isStaff && (
                <>
                  <Link
                    href="/account/wishlist"
                    className="hidden sm:inline text-[0.72rem] font-bold uppercase tracking-[0.13em] text-ink hover:text-marigold-lit"
                  >
                    Wishlist
                  </Link>
                  <Link
                    href="/cart"
                    className="text-[0.72rem] font-bold uppercase tracking-[0.13em] text-ink hover:text-marigold-lit"
                  >
                    Bag
                    {itemCount > 0 && (
                      <span className="ml-1.5 bg-kumkum text-white rounded-full text-[0.6rem] px-1.5 py-0.5 font-extrabold align-middle">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen((o) => !o)}
                aria-expanded={mobileOpen}
                aria-label="Toggle category menu"
                className="lg:hidden text-ink text-lg leading-none px-1"
              >
                {mobileOpen ? '✕' : '≡'}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="lg:hidden border-t border-line py-3 grid gap-0.5">
              <form onSubmit={submitSearch} className="md:hidden pb-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search shirts, sarees, lipsticks…"
                  aria-label="Search products"
                  className="w-full bg-card border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-marigold"
                />
              </form>
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-2.5 text-sm font-semibold uppercase tracking-[0.06em] text-ink-soft hover:text-ink"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
