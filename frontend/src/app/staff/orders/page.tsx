'use client';

import { useState } from 'react';
import { useBulkShip, useStaffOrders, useUpdateOrderStatus } from '@/hooks/useStaff';
import {
  EmptyState,
  ErrorState,
  Panel,
  StatusPill,
  TableScroll,
  money,
  shortDate,
} from '@/components/staff/ui';

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'packed',
  packed: 'shipped',
  shipped: 'delivered',
};

const STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

export default function StaffOrdersPage() {
  const [filters, setFilters] = useState({ status: '', payment_status: '', search: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [provider, setProvider] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [message, setMessage] = useState('');

  const { data, isLoading, isError } = useStaffOrders({ ...filters, page: String(page) });
  const updateStatus = useUpdateOrderStatus();
  const bulkShip = useBulkShip();

  function setFilter(key: keyof typeof filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setSelected([]);
  }

  const shippable = (data?.results ?? []).filter(
    (o) => !['shipped', 'delivered', 'cancelled'].includes(o.status)
  );
  const allShippableSelected =
    shippable.length > 0 && shippable.every((o) => selected.includes(o.order_id));

  function handleBulkShip() {
    setMessage('');
    bulkShip.mutate(
      {
        order_ids: selected,
        tracking_provider: provider || undefined,
        // A tracking id identifies one parcel, so only send it for a single order.
        tracking_id: selected.length === 1 ? trackingId || undefined : undefined,
      },
      {
        onSuccess: (res) => {
          const skipped = res.skipped?.length
            ? ` ${res.skipped.length} skipped.`
            : '';
          setMessage(`Marked ${res.updated.length} shipped.${skipped}`);
          setSelected([]);
          setTrackingId('');
        },
        onError: (err: unknown) => {
          const detail = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
          setMessage(detail ?? 'Could not mark those shipped.');
        },
      }
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2.5 items-center">
        <input
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Order id, email or phone"
          className="border border-line px-3 py-2 bg-card text-sm min-w-[220px] flex-1"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="border border-line px-3 py-2 bg-card text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.payment_status}
          onChange={(e) => setFilter('payment_status', e.target.value)}
          className="border border-line px-3 py-2 bg-card text-sm"
        >
          <option value="">Any payment</option>
          {['pending', 'paid', 'refunded', 'failed'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {selected.length > 0 && (
        <div className="border border-kumkum/30 bg-kumkum/5 p-4 grid gap-3 sm:flex sm:items-end">
          <div className="grid gap-1">
            <label htmlFor="provider" className="eyebrow">Courier</label>
            <input
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. Delhivery"
              className="border border-line px-3 py-2 bg-card text-sm"
            />
          </div>
          {selected.length === 1 && (
            <div className="grid gap-1">
              <label htmlFor="tracking" className="eyebrow">Tracking id</label>
              <input
                id="tracking"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="border border-line px-3 py-2 bg-card text-sm"
              />
            </div>
          )}
          <button
            onClick={handleBulkShip}
            disabled={bulkShip.isPending}
            className="bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm px-5 py-2.5 disabled:opacity-50 sm:ml-auto"
          >
            {bulkShip.isPending ? 'Marking…' : `Mark ${selected.length} shipped`}
          </button>
          {selected.length > 1 && (
            <p className="text-xs text-ink-soft sm:max-w-[220px]">
              Tracking ids are per parcel — mark these individually to record one.
            </p>
          )}
        </div>
      )}

      {message && <p className="text-sm text-leaf">{message}</p>}

      <Panel title={`Orders${data ? ` · ${data.count}` : ''}`}>
        {isLoading ? (
          <p className="text-sm text-ink-soft py-6">Loading…</p>
        ) : isError ? (
          <ErrorState />
        ) : !data?.results.length ? (
          <EmptyState message="No orders match these filters." />
        ) : (
          <>
            <TableScroll>
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="text-left text-ink-soft">
                    <th className="pb-2 w-8">
                      <input
                        type="checkbox"
                        aria-label="Select all shippable orders"
                        checked={allShippableSelected}
                        onChange={(e) =>
                          setSelected(e.target.checked ? shippable.map((o) => o.order_id) : [])
                        }
                      />
                    </th>
                    <th className="font-medium pb-2">Order</th>
                    <th className="font-medium pb-2">Placed</th>
                    <th className="font-medium pb-2">Items</th>
                    <th className="font-medium pb-2">Status</th>
                    <th className="font-medium pb-2">Payment</th>
                    <th className="font-medium pb-2">Fulfilment</th>
                    <th className="font-medium pb-2 text-right">Total</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((o) => {
                    const canShip = !['shipped', 'delivered', 'cancelled'].includes(o.status);
                    const next = NEXT_STATUS[o.status];
                    return (
                      <tr key={o.order_id} className="border-t border-line">
                        <td className="py-2.5">
                          <input
                            type="checkbox"
                            aria-label={`Select ${o.order_id}`}
                            disabled={!canShip}
                            checked={selected.includes(o.order_id)}
                            onChange={(e) =>
                              setSelected((s) =>
                                e.target.checked
                                  ? [...s, o.order_id]
                                  : s.filter((id) => id !== o.order_id)
                              )
                            }
                          />
                        </td>
                        <td className="py-2.5 font-bold whitespace-nowrap">{o.order_id}</td>
                        <td className="py-2.5 text-ink-soft whitespace-nowrap">
                          {shortDate(o.created_at)}
                        </td>
                        <td className="py-2.5 num">{o.item_count}</td>
                        <td className="py-2.5"><StatusPill value={o.status} /></td>
                        <td className="py-2.5"><StatusPill value={o.payment_status} /></td>
                        <td className="py-2.5 text-ink-soft whitespace-nowrap">
                          {o.delivery_type === 'store_pickup' ? 'Pickup' : 'Delivery'}
                        </td>
                        <td className="py-2.5 text-right num font-bold whitespace-nowrap">
                          {money(o.total)}
                        </td>
                        <td className="py-2.5 text-right">
                          {next && (
                            <button
                              onClick={() =>
                                updateStatus.mutate({ orderId: o.order_id, status: next })
                              }
                              disabled={updateStatus.isPending}
                              className="text-xs font-bold underline whitespace-nowrap disabled:opacity-50"
                            >
                              Mark {next}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableScroll>

            {data.num_pages > 1 && (
              <div className="flex items-center gap-3 mt-4 text-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border border-line px-3 py-1.5 font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-ink-soft">Page {data.page} of {data.num_pages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(data.num_pages, p + 1))}
                  disabled={page >= data.num_pages}
                  className="border border-line px-3 py-1.5 font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
