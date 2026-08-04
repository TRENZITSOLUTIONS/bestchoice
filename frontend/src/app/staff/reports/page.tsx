'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStaffReports } from '@/hooks/useStaff';
import {
  EmptyState,
  ErrorState,
  Panel,
  TableScroll,
  money,
} from '@/components/staff/ui';

const RANGES = [7, 30, 90, 365];

export default function StaffReportsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useStaffReports(days);

  const categoryMax = Math.max(
    ...(data?.revenue_by_category ?? []).map((c) => Number(c.revenue)),
    1
  );

  return (
    <div className="grid gap-6">
      <div className="flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setDays(r)}
            className={`text-xs font-bold px-3 py-1.5 rounded ${
              days === r ? 'bg-kumkum text-white' : 'text-ink-soft hover:bg-ivory-raised'
            }`}
          >
            {r === 365 ? '1y' : `${r}d`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-soft py-6">Loading…</p>
      ) : isError || !data ? (
        <ErrorState />
      ) : (
        <>
          <Panel title="Top sellers">
            {!data.top_products.length ? (
              <EmptyState message={`No paid orders in the last ${days} days.`} />
            ) : (
              <TableScroll>
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="text-left text-ink-soft">
                      <th className="font-medium pb-2">Product</th>
                      <th className="font-medium pb-2 text-right">Units</th>
                      <th className="font-medium pb-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products.map((p) => (
                      <tr key={`${p.product_id}-${p.name}`} className="border-t border-line">
                        <td className="py-2.5">
                          {p.slug ? (
                            <Link href={`/products/${p.slug}`} className="hover:underline font-medium">
                              {p.name}
                            </Link>
                          ) : (
                            <span className="text-ink-soft">{p.name}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right num">{p.units}</td>
                        <td className="py-2.5 text-right num font-bold">{money(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            )}
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Revenue by category">
              {!data.revenue_by_category.length ? (
                <EmptyState message="No sales in this period." />
              ) : (
                <ul className="grid gap-3">
                  {data.revenue_by_category.map((c) => (
                    <li key={c.category} className="grid gap-1">
                      <div className="flex items-baseline gap-3 text-sm">
                        <span className="font-medium">{c.category}</span>
                        <span className="ml-auto num font-bold">{money(c.revenue)}</span>
                      </div>
                      <div className="h-1.5 rounded bg-line overflow-hidden">
                        <div
                          className="h-full bg-kumkum rounded"
                          style={{ width: `${(Number(c.revenue) / categoryMax) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink-soft num">{c.units} units</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Home delivery vs store pickup">
              {!data.by_delivery_type.length ? (
                <EmptyState message="No sales in this period." />
              ) : (
                <ul className="grid gap-3">
                  {data.by_delivery_type.map((d) => (
                    <li key={d.delivery_type} className="flex items-baseline gap-3 text-sm">
                      <span className="font-medium capitalize">
                        {d.delivery_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-ink-soft num">{d.orders} orders</span>
                      <span className="ml-auto num font-bold">{money(d.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
