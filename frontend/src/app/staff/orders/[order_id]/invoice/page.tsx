'use client';

import { use } from 'react';
import Link from 'next/link';
import { useStaffOrderDetail } from '@/hooks/useStaff';
import { OrderInvoice } from '@/components/OrderInvoice';
import { ErrorState } from '@/components/staff/ui';

export default function StaffOrderInvoicePage({ params }: { params: Promise<{ order_id: string }> }) {
  const { order_id } = use(params);
  const { data: order, isLoading, isError } = useStaffOrderDetail(order_id);

  if (isLoading) return <p className="text-sm text-ink-soft py-6">Loading…</p>;
  if (isError || !order) return <ErrorState message="Could not find that order." />;

  return (
    <div>
      <div className="no-print flex justify-between items-center mb-4">
        <Link href={`/staff/orders/${order_id}`} className="text-xs font-bold text-ink-soft hover:text-ink">
          ← Back to order
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-4 py-2"
        >
          Print / Save as PDF
        </button>
      </div>
      <OrderInvoice order={order} />
    </div>
  );
}
