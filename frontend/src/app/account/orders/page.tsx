'use client';

import Link from 'next/link';
import { useOrders } from '@/hooks/useOrders';
import { AccountNav } from '@/components/account/AccountNav';

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders();

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-7">
      <h1 className="display text-2xl mb-6">Your Orders</h1>
      <div className="grid sm:grid-cols-[200px_1fr] gap-8">
        <AccountNav />
        <div>
          {isLoading && <p className="text-sm text-ink-soft">Loading...</p>}
          {!isLoading && orders?.length === 0 && <p className="text-sm text-ink-soft">No orders yet.</p>}
          <div className="grid gap-3">
            {orders?.map((o) => (
              <Link key={o.order_id} href={`/account/orders/${o.order_id}`} className="border border-line rounded p-4.5 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold">{o.order_id}</p>
                  <p className="text-ink-soft text-xs mt-1">{new Date(o.created_at).toLocaleDateString()} · {o.item_count} items</p>
                </div>
                <div className="text-right">
                  <p className="font-bold num">₹{o.total}</p>
                  <p className="text-ink-soft text-xs capitalize mt-1">{o.status} · {o.payment_status}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
