'use client';

import { useState } from 'react';
import { useStaffPincodes } from '@/hooks/useStaff';
import { EmptyState, ErrorState, Panel, StatusPill, TableScroll } from '@/components/staff/ui';

export default function StaffDeliveryPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useStaffPincodes(search);

  return (
    <div className="grid gap-5">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pincode or city"
        className="border border-line rounded px-3 py-2 bg-card text-sm max-w-xs"
      />

      <Panel title={`Delivery pincodes${data ? ` · ${data.count}` : ''}`}>
        {isLoading ? (
          <p className="text-sm text-ink-soft py-6">Loading…</p>
        ) : isError ? (
          <ErrorState />
        ) : !data?.results.length ? (
          <EmptyState message="No pincodes match." />
        ) : (
          <TableScroll>
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-ink-soft">
                  <th className="font-medium pb-2">Pincode</th>
                  <th className="font-medium pb-2">City</th>
                  <th className="font-medium pb-2">Service</th>
                  <th className="font-medium pb-2">Estimate</th>
                  <th className="font-medium pb-2">Store pickup</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="py-2.5 font-bold num">{p.pincode}</td>
                    <td className="py-2.5">{p.city}</td>
                    <td className="py-2.5">
                      <StatusPill
                        value={p.delivery_type === 'same_day' ? 'delivered' : 'shipped'}
                        label={p.delivery_type.replace(/_/g, ' ')}
                      />
                    </td>
                    <td className="py-2.5 text-ink-soft">{p.estimated_days_text}</td>
                    <td className="py-2.5 text-ink-soft">
                      {p.store_pickup_available ? 'Yes' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}

        <p className="text-xs text-ink-soft mt-4">
          Adding, editing or bulk-importing pincodes happens in Django Admin, or with the{' '}
          <code>import_pincodes</code> management command. Rates for outside Tamil Nadu are set on
          the Outside state delivery rate record.
        </p>
      </Panel>
    </div>
  );
}
