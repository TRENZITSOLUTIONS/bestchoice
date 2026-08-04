'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDashboardStats, useStaffOrders } from '@/hooks/useStaff';
import {
  EmptyState,
  ErrorState,
  Panel,
  Sparkbars,
  StatCard,
  StatusPill,
  TableScroll,
  money,
  shortDate,
} from '@/components/staff/ui';

const RANGES = [7, 30, 90];

export default function StaffOverviewPage() {
  const [days, setDays] = useState(7);
  const { data: stats, isLoading, isError } = useDashboardStats(days);
  const { data: recent } = useStaffOrders({ page_size: '8' });

  if (isLoading) return <p className="text-sm text-ink-soft py-10">Loading…</p>;
  if (isError || !stats) return <ErrorState />;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Revenue · last ${days}d`}
          value={money(stats.revenue_period)}
          hint={`${money(stats.revenue_total)} all time`}
        />
        <StatCard
          label={`Paid orders · last ${days}d`}
          value={stats.orders_period}
          hint={`${stats.orders_total} all time`}
        />
        <StatCard
          label="Needs action"
          value={stats.orders_awaiting_action}
          hint="pending, confirmed or packed"
          tone={stats.orders_awaiting_action > 0 ? 'attention' : undefined}
        />
        <StatCard
          label="Out of stock"
          value={stats.products_out_of_stock}
          hint={`of ${stats.products_active} active products`}
          tone={stats.products_out_of_stock > 0 ? 'attention' : 'good'}
        />
      </div>

      {(stats.refunds_pending > 0 || stats.reviews_pending > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.refunds_pending > 0 && (
            <Link
              href="/staff/refunds"
              className="border border-marigold/40 bg-marigold/10 rounded px-4 py-2.5 text-sm font-bold"
            >
              {stats.refunds_pending} refund{stats.refunds_pending === 1 ? '' : 's'} awaiting review →
            </Link>
          )}
          {stats.reviews_pending > 0 && (
            <Link
              href="/staff/reviews"
              className="border border-marigold/40 bg-marigold/10 rounded px-4 py-2.5 text-sm font-bold"
            >
              {stats.reviews_pending} review{stats.reviews_pending === 1 ? '' : 's'} to moderate →
            </Link>
          )}
        </div>
      )}

      <Panel
        title="Revenue"
        action={
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`text-xs font-bold px-2.5 py-1 rounded ${
                  days === r ? 'bg-kumkum text-white' : 'text-ink-soft hover:bg-ivory-raised'
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      >
        {stats.sales_chart.some((p) => Number(p.revenue) > 0) ? (
          <Sparkbars points={stats.sales_chart} />
        ) : (
          <EmptyState message={`No paid orders in the last ${days} days.`} />
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Recent orders"
          action={
            <Link href="/staff/orders" className="text-xs font-bold text-kumkum-deep">
              All orders →
            </Link>
          }
        >
          {!recent?.results.length ? (
            <EmptyState message="No orders yet." />
          ) : (
            <TableScroll>
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-left text-ink-soft">
                    <th className="font-medium pb-2">Order</th>
                    <th className="font-medium pb-2">Placed</th>
                    <th className="font-medium pb-2">Status</th>
                    <th className="font-medium pb-2">Payment</th>
                    <th className="font-medium pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.results.map((o) => (
                    <tr key={o.order_id} className="border-t border-line">
                      <td className="py-2.5">
                        <Link href="/staff/orders" className="font-bold hover:underline">
                          {o.order_id}
                        </Link>
                      </td>
                      <td className="py-2.5 text-ink-soft">{shortDate(o.created_at)}</td>
                      <td className="py-2.5"><StatusPill value={o.status} /></td>
                      <td className="py-2.5"><StatusPill value={o.payment_status} /></td>
                      <td className="py-2.5 text-right num font-bold">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </Panel>

        <Panel title="Orders by status">
          {Object.keys(stats.orders_by_status).length === 0 ? (
            <EmptyState message="No orders yet." />
          ) : (
            <ul className="grid gap-2">
              {Object.entries(stats.orders_by_status)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status} className="flex items-center gap-3">
                    <StatusPill value={status} />
                    <span className="ml-auto num font-bold">{count}</span>
                  </li>
                ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
