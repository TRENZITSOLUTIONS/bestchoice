'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useState } from 'react';

const categories = [
  { name: "Men's Wear", slug: 'mens-wear' },
  { name: "Women's Wear", slug: 'womens-wear' },
  { name: 'Kids Wear', slug: 'kids-wear' },
  { name: 'Cosmetics', slug: 'cosmetics' },
];

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const cartItems = useCartStore((s) => s.items);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            BestChoice
          </Link>

          <nav className="hidden md:flex space-x-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className={`text-sm hover:text-blue-600 ${pathname.includes(cat.slug) ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                  }
                }}
                className="border rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Link href="/cart" className="relative">
              <span className="text-lg">🛒</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <Link href="/account" className="text-sm text-gray-700 hover:text-blue-600">
                {user?.first_name || 'Account'}
              </Link>
            ) : (
              <Link href="/auth/login" className="text-sm text-gray-700 hover:text-blue-600">
                Login
              </Link>
            )}

            <button
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span className="text-xl">{mobileOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="block py-1 text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <input
              type="text"
              placeholder="Search..."
              className="border rounded w-full px-3 py-1.5 text-sm mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(e.currentTarget.value)}`;
                }
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
