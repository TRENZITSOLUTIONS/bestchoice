'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useLogout } from '@/hooks/useAuth';

const LINKS = [
  { href: '/staff', label: 'Overview' },
  { href: '/staff/orders', label: 'Orders' },
  { href: '/staff/inventory', label: 'Inventory' },
  { href: '/staff/refunds', label: 'Refunds' },
  { href: '/staff/reviews', label: 'Reviews' },
  { href: '/staff/coupons', label: 'Coupons' },
  { href: '/staff/delivery', label: 'Delivery' },
  { href: '/staff/reports', label: 'Reports' },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useLogout();

  // The sign-in page itself is public; everything else needs a staff account.
  if (pathname === '/staff/login') return <>{children}</>;

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[520px] px-4 py-24 text-center">
        <p className="eyebrow">Staff area</p>
        <h1 className="display text-2xl mt-2 mb-4">Sign in to continue</h1>
        <Link
          href="/staff/login"
          className="inline-block bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm px-6 py-3"
        >
          Staff sign in
        </Link>
      </div>
    );
  }

  if (!user?.is_staff) {
    return (
      <div className="mx-auto max-w-[520px] px-4 py-24 text-center">
        <p className="eyebrow">Staff area</p>
        <h1 className="display text-2xl mt-2 mb-3">You don&apos;t have access</h1>
        <p className="text-ink-soft mb-7">
          You&apos;re signed in as {user?.email}, which isn&apos;t a staff account. If you
          manage this store, sign in with your staff credentials.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="border border-line px-5 py-2.5 text-sm font-bold">
            Back to shop
          </Link>
          <button
            onClick={logout}
            className="bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm px-5 py-2.5"
          >
            Switch account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-7 py-7">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-6">
        <h1 className="display text-xl">Store management</h1>
        <p className="text-sm text-ink-soft">{user.email}</p>
        <Link href="/" className="ml-auto text-sm font-bold text-kumkum-deep">
          View storefront →
        </Link>
      </header>

      <div className="grid lg:grid-cols-[190px_1fr] gap-7">
        <nav
          aria-label="Store management"
          className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:border-r border-line lg:pr-5 h-fit text-sm"
        >
          {LINKS.map((link) => {
            const active =
              link.href === '/staff' ? pathname === '/staff' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`px-3 py-2 font-medium whitespace-nowrap ${
                  active ? 'bg-kumkum text-white' : 'text-ink-soft hover:bg-ivory-raised'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
