'use client';

import { useState } from 'react';
import { useDeliveryRates, useStaffPincodes } from '@/hooks/useStaff';
import { EmptyState, ErrorState, Panel, StatusPill, TableScroll, money } from '@/components/staff/ui';

function RateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="ml-auto num font-bold">{value}</span>
    </div>
  );
}

export default function StaffDeliveryPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useStaffPincodes(search);
  const { data: rates } = useDeliveryRates();

  return (
    <div className="grid gap-5">
      {rates && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Tamil Nadu rates">
            <div className="grid gap-2">
              <RateRow label="Local (Chennai metro)" value={money(rates.tamil_nadu.local_charge)} />
              <RateRow label="Standard" value={money(rates.tamil_nadu.standard_charge)} />
              <RateRow
                label="Free delivery from"
                value={money(rates.tamil_nadu.free_delivery_threshold)}
              />
              <RateRow
                label={`Weight surcharge per 500g over ${rates.tamil_nadu.weight_allowance_g}g`}
                value={money(rates.tamil_nadu.weight_surcharge_per_500g)}
              />
              <RateRow label="Estimate shown" value={rates.tamil_nadu.estimated_days_text} />
            </div>
          </Panel>

          <Panel title="Outside Tamil Nadu rates">
            <div className="grid gap-2">
              {!rates.outside_tamil_nadu.is_active && (
                <p className="text-xs text-kumkum-deep font-bold mb-1">
                  Turned off — orders outside Tamil Nadu are rejected at checkout.
                </p>
              )}
              <RateRow label="Base charge" value={money(rates.outside_tamil_nadu.base_charge)} />
              <RateRow
                label="Free delivery from"
                value={money(rates.outside_tamil_nadu.free_delivery_threshold)}
              />
              <RateRow
                label={`Weight surcharge per 500g over ${rates.outside_tamil_nadu.weight_allowance_g}g`}
                value={money(rates.outside_tamil_nadu.weight_surcharge_per_500g)}
              />
              <RateRow label="Estimate shown" value={rates.outside_tamil_nadu.estimated_days_text} />
              <RateRow
                label="Cash on delivery"
                value={rates.outside_tamil_nadu.cod_available ? 'Yes' : 'No'}
              />
            </div>
          </Panel>
        </div>
      )}

      <p className="text-xs text-ink-soft -mb-1">
        Every rate above is editable in Django Admin under <strong>Delivery</strong> →
        Tamil Nadu delivery rate / Outside Tamil Nadu delivery rate. Changes apply to the
        next quote — no deploy needed.
      </p>

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
                  <th className="font-medium pb-2">Rate zone</th>
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
                        value={p.delivery_type === 'local' ? 'delivered' : 'shipped'}
                        label={p.delivery_type === 'local' ? 'Local ₹30' : 'Standard ₹80'}
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
          <code>import_pincodes</code> management command. A pincode can also carry its own
          delivery charge, which overrides the zone rate above.
        </p>
      </Panel>
    </div>
  );
}
