'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCategories } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cart';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth';

export function Header() {
  const { data: categories } = useCategories();
  useCart(); // keeps the cart store warm so the bag count is accurate everywhere
  const itemCount = useCartStore((s) => s.itemCount());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [query, setQuery] = useState('');

  return (
    <>
      <div className="bg-kumkum-deep text-white text-center text-xs sm:text-sm py-2 px-3 tracking-wide">
        Free delivery in Tamil Nadu on orders above ₹500 · Same-day delivery in Chennai
      </div>

      <header className="border-b border-line bg-ivory">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-7">
          <div className="flex items-center gap-4 sm:gap-8 py-4 flex-wrap">
            <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-tight whitespace-nowrap">
              Best<span className="text-kumkum">Choice</span>
            </Link>

            <nav className="hidden lg:flex gap-1 text-sm font-semibold">
              {categories?.map((cat) => (
                <div key={cat.id} className="relative group">
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="block px-3 py-2 rounded group-hover:bg-ivory-raised"
                  >
                    {cat.name}
                  </Link>
                  {cat.children.length > 0 && (
                    <div className="hidden group-hover:block absolute top-full left-0 pt-2.5 z-50">
                      <div className="bg-card border border-line rounded shadow-lg p-4 min-w-[190px] grid gap-1">
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/products?category=${child.slug}`}
                            className="text-sm font-medium px-2 py-1.5 rounded whitespace-nowrap hover:bg-ivory-raised hover:text-kumkum-deep"
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

            <form
              action="/products"
              className="flex-1 max-w-[360px] hidden sm:flex items-center gap-2 bg-card border border-line rounded px-3.5 py-2 text-sm text-ink-soft"
            >
              <span aria-hidden>🔍</span>
              <input
                name="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shirts, sarees, lipsticks..."
                className="flex-1 bg-transparent outline-none placeholder:text-ink-soft"
              />
            </form>

            <div className="ml-auto flex items-center gap-5 text-sm font-semibold">
              <Link href={isAuthenticated ? '/account' : '/auth/login'}>Account</Link>
              <Link href="/account/wishlist" className="hidden sm:inline">
                Wishlist
              </Link>
              <Link href="/cart">
                Bag
                {itemCount > 0 && (
                  <span className="ml-1 bg-kumkum text-white rounded-full text-[0.66rem] px-1.5 py-0.5 font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
