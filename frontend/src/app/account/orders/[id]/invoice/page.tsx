'use client';

import { use } from 'react';
import Link from 'next/link';
import { useOrder } from '@/hooks/useOrders';
import { OrderInvoice } from '@/components/OrderInvoice';

export default function OrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) return <p className="text-center py-20 text-ink-soft">Loading...</p>;
  if (!order) return <p className="text-center py-20 text-ink-soft">Order not found.</p>;

  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-7 py-7">
      <div className="no-print flex justify-between items-center mb-4">
        <Link href={`/account/orders/${id}`} className="text-sm font-bold text-ink-soft hover:text-ink">
          ← Back to order
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm rounded px-5 py-2.5"
        >
          Print / Save as PDF
        </button>
      </div>
      <OrderInvoice order={order} />
    </div>
  );
}
