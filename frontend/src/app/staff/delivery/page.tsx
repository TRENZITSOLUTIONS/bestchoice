'use client';

import { useState } from 'react';
import {
  useDeliveryRates,
  useStaffPincodes,
  useUpdateOutsideStateRate,
  useUpdateTamilNaduRate,
} from '@/hooks/useStaff';
import { EmptyState, ErrorState, Panel, StatusPill, TableScroll } from '@/components/staff/ui';
import { RateCardEditor, type RateField } from '@/components/staff/RateCardEditor';

const TN_FIELDS: RateField[] = [
  { key: 'local_charge', label: 'Local (Chennai metro)', kind: 'money' },
  { key: 'standard_charge', label: 'Standard', kind: 'money' },
  { key: 'free_delivery_threshold', label: 'Free delivery from', kind: 'money' },
  { key: 'weight_surcharge_per_500g', label: 'Surcharge per 500g', kind: 'money' },
  { key: 'weight_allowance_g', label: 'Weight allowance (g)', kind: 'int' },
  { key: 'estimated_days_text', label: 'Estimate shown', kind: 'text' },
];

const OUTSIDE_FIELDS: RateField[] = [
  { key: 'base_charge', label: 'Base charge', kind: 'money' },
  { key: 'free_delivery_threshold', label: 'Free delivery from', kind: 'money' },
  { key: 'weight_surcharge_per_500g', label: 'Surcharge per 500g', kind: 'money' },
  { key: 'weight_allowance_g', label: 'Weight allowance (g)', kind: 'int' },
  { key: 'estimated_days_text', label: 'Estimate shown', kind: 'text' },
];

function firstError(err: unknown): string | undefined {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return err ? 'Could not save those rates.' : undefined;
  const [field, msg] = Object.entries(data)[0] ?? [];
  if (!field) return 'Could not save those rates.';
  return `${field}: ${Array.isArray(msg) ? msg.join(' ') : String(msg)}`;
}

export default function StaffDeliveryPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useStaffPincodes(search);
  const { data: rates } = useDeliveryRates();
  const updateTn = useUpdateTamilNaduRate();
  const updateOutside = useUpdateOutsideStateRate();

  return (
    <div className="grid gap-6">
      {rates && (
        <div className="grid gap-5 lg:grid-cols-2">
          <RateCardEditor
            title="Tamil Nadu rates"
            fields={TN_FIELDS}
            values={{
              local_charge: rates.tamil_nadu.local_charge,
              standard_charge: rates.tamil_nadu.standard_charge,
              free_delivery_threshold: rates.tamil_nadu.free_delivery_threshold,
              weight_surcharge_per_500g: rates.tamil_nadu.weight_surcharge_per_500g,
              weight_allowance_g: String(rates.tamil_nadu.weight_allowance_g),
              estimated_days_text: rates.tamil_nadu.estimated_days_text,
            }}
            onSave={(changed) => updateTn.mutate(changed)}
            isSaving={updateTn.isPending}
            error={updateTn.isError ? firstError(updateTn.error) : undefined}
            footnote="A pincode with its own delivery charge set overrides the zone rate."
          />

          <RateCardEditor
            title="Outside Tamil Nadu rates"
            fields={OUTSIDE_FIELDS}
            values={{
              base_charge: rates.outside_tamil_nadu.base_charge,
              free_delivery_threshold: rates.outside_tamil_nadu.free_delivery_threshold,
              weight_surcharge_per_500g: rates.outside_tamil_nadu.weight_surcharge_per_500g,
              weight_allowance_g: String(rates.outside_tamil_nadu.weight_allowance_g),
              estimated_days_text: rates.outside_tamil_nadu.estimated_days_text,
            }}
            onSave={(changed) => updateOutside.mutate(changed)}
            isSaving={updateOutside.isPending}
            error={updateOutside.isError ? firstError(updateOutside.error) : undefined}
            footnote={
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  Delivery outside Tamil Nadu is{' '}
                  <strong className={rates.outside_tamil_nadu.is_active ? 'text-leaf' : 'text-kumkum'}>
                    {rates.outside_tamil_nadu.is_active ? 'on' : 'off'}
                  </strong>
                  {!rates.outside_tamil_nadu.is_active && ' — those orders are rejected at checkout.'}
                </span>
                <button
                  onClick={() =>
                    updateOutside.mutate({ is_active: !rates.outside_tamil_nadu.is_active })
                  }
                  disabled={updateOutside.isPending}
                  className="font-bold underline disabled:opacity-50"
                >
                  Turn {rates.outside_tamil_nadu.is_active ? 'off' : 'on'}
                </button>
              </div>
            }
          />
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pincode or city"
        className="max-w-xs border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-marigold"
      />

      <Panel title={`Delivery pincodes${data ? ` · ${data.count}` : ''}`}>
        {isLoading ? (
          <p className="py-6 text-sm text-ink-soft">Loading…</p>
        ) : isError ? (
          <ErrorState />
        ) : !data?.results.length ? (
          <EmptyState message="No pincodes match." />
        ) : (
          <TableScroll>
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-ink-soft">
                  <th className="pb-2 font-medium">Pincode</th>
                  <th className="pb-2 font-medium">City</th>
                  <th className="pb-2 font-medium">Rate zone</th>
                  <th className="pb-2 font-medium">Estimate</th>
                  <th className="pb-2 font-medium">Store pickup</th>
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
                        label={p.delivery_type === 'local' ? 'Local' : 'Standard'}
                      />
                    </td>
                    <td className="py-2.5 text-ink-soft">{p.estimated_days_text}</td>
                    <td className="py-2.5 text-ink-soft">{p.store_pickup_available ? 'Yes' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}

        <p className="mt-4 text-xs text-ink-faint">
          Adding, editing or bulk-importing pincodes happens in Django Admin, or with the{' '}
          <code>import_pincodes</code> management command.
        </p>
      </Panel>
    </div>
  );
}
