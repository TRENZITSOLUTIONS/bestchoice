'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const LINKS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/wishlist', label: 'Wishlist' },
  { href: '/account/loyalty', label: 'Best Choice Rewards' },
];

export function AccountNav() {
  const pathname = usePathname();
  const logout = useLogout();
  const router = useRouter();

  return (
    <aside className="border-r border-line pr-6 text-sm h-fit">
      <nav className="grid gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded font-medium ${pathname === link.href ? 'bg-kumkum text-white' : 'text-ink-soft hover:bg-ivory-raised'}`}
          >
            {link.label}
          </Link>
        ))}
        <button
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="px-3 py-2 rounded font-medium text-left text-ink-soft hover:bg-ivory-raised"
        >
          Log out
        </button>
      </nav>
    </aside>
  );
}
