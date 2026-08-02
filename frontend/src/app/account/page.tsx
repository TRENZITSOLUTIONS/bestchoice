'use client';

import Link from 'next/link';
import { useProfile } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useLoyaltyBalance } from '@/hooks/useLoyalty';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuthStore } from '@/store/auth';
import { AccountNav } from '@/components/account/AccountNav';

export default function AccountPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: profile } = useProfile();
  const { data: orders } = useOrders();
  const { data: loyalty } = useLoyaltyBalance();
  const { data: wishlist } = useWishlist();

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-20 text-center">
        <h1 className="display text-2xl mb-4">Sign in to view your account</h1>
        <Link href="/auth/login" className="inline-block bg-kumkum text-white font-bold text-sm px-6 py-3 rounded">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-7">
      <h1 className="display text-2xl mb-6">
        Hello, {profile?.first_name || 'there'}
      </h1>
      <div className="grid sm:grid-cols-[200px_1fr] gap-8">
        <AccountNav />
        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Orders" value={orders?.length ?? 0} href="/account/orders" />
            <StatCard label="Wishlist" value={wishlist?.length ?? 0} href="/account/wishlist" />
            <StatCard label="Reward Points" value={loyalty?.points ?? 0} href="/account/loyalty" />
          </div>

          <h2 className="font-bold mb-3">Recent Orders</h2>
          {orders && orders.length > 0 ? (
            <div className="grid gap-3">
              {orders.slice(0, 3).map((o) => (
                <Link key={o.order_id} href={`/account/orders/${o.order_id}`} className="border border-line rounded p-4 flex justify-between text-sm">
                  <div>
                    <p className="font-semibold">{o.order_id}</p>
                    <p className="text-ink-soft text-xs mt-0.5">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold num">₹{o.total}</p>
                    <p className="text-ink-soft text-xs capitalize mt-0.5">{o.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="border border-line rounded p-4.5 text-center">
      <div className="text-2xl font-extrabold num">{value}</div>
      <div className="text-xs text-ink-soft mt-1">{label}</div>
    </Link>
  );
}
