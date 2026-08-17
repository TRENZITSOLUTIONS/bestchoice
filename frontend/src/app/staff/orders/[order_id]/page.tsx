'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeleteOrder, useStaffOrderDetail, useUpdateOrderStatus } from '@/hooks/useStaff';
import { ErrorState, Panel, StatusPill, money, shortDate } from '@/components/staff/ui';

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'packed',
  packed: 'shipped',
  shipped: 'delivered',
};

export default function StaffOrderDetailPage({ params }: { params: Promise<{ order_id: string }> }) {
  const { order_id } = use(params);
  const router = useRouter();
  const { data: order, isLoading, isError } = useStaffOrderDetail(order_id);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

  function handleDelete() {
    if (!order) return;
    const ok = confirm(
      `Delete order ${order.order_id}? This removes its items, status history, refund records and coupon usage too - the customer's loyalty points balance is not affected. This cannot be undone.`
    );
    if (!ok) return;
    deleteOrder.mutate(order.order_id, { onSuccess: () => router.push('/staff/orders') });
  }

  const next = order ? NEXT_STATUS[order.status] : undefined;
  const address = order?.shipping_address;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/staff/orders" className="text-xs font-bold text-ink-soft hover:text-ink">
          ← Back to orders
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-soft py-6">Loading…</p>
      ) : isError || !order ? (
        <ErrorState message="Could not find that order." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
            <div>
              <p className="eyebrow mb-1">Order</p>
              <h2 className="text-lg font-bold tracking-tight">{order.order_id}</h2>
              <p className="text-xs text-ink-soft mt-1">Placed {shortDate(order.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill value={order.status} />
              <StatusPill value={order.payment_status} />
            </div>
            {next && (
              <button
                onClick={() => updateStatus.mutate({ orderId: order.order_id, status: next })}
                disabled={updateStatus.isPending}
                className="ml-auto bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-4 py-2 disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Updating…' : `Mark ${next}`}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleteOrder.isPending}
              className={`${next ? '' : 'ml-auto'} text-xs font-bold text-kumkum hover:text-kumkum-deep disabled:opacity-50`}
            >
              {deleteOrder.isPending ? 'Deleting…' : 'Delete order'}
            </button>
          </div>
          {deleteOrder.isError && <p className="text-sm text-kumkum">Could not delete that order.</p>}

          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-5 min-w-0">
              <Panel title="Items">
                <div className="grid gap-2.5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm py-2 border-b border-line last:border-0"
                    >
                      <div>
                        <p className="font-semibold">{item.product_snapshot.name}</p>
                        <p className="text-xs text-ink-soft num">
                          {item.product_snapshot.sku} · Qty {item.quantity}
                        </p>
                      </div>
                      <span className="num">{money(item.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-1.5 mt-4 pt-4 border-t border-line text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Subtotal</span>
                    <span className="num">{money(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Delivery</span>
                    <span className="num">{money(order.delivery_charge)}</span>
                  </div>
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Discount</span>
                      <span className="num">−{money(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold pt-1.5 mt-1 border-t border-line">
                    <span>Total</span>
                    <span className="num">{money(order.total)}</span>
                  </div>
                </div>
              </Panel>

              {order.notes && (
                <Panel title="Notes">
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                </Panel>
              )}

              {order.status_history.length > 0 && (
                <Panel title="Status history">
                  <div className="grid gap-3.5">
                    {order.status_history.map((h, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="w-2 h-2 rounded-full bg-kumkum mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold capitalize">{h.status}</p>
                          <p className="text-ink-soft text-xs">
                            {h.note} · {new Date(h.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {order.refunds.length > 0 && (
                <Panel title="Refunds">
                  <div className="grid gap-3">
                    {order.refunds.map((r) => (
                      <div key={r.id} className="text-sm">
                        <div className="flex items-center gap-2">
                          <StatusPill value={r.status} />
                          <span className="font-bold num">{money(r.amount)}</span>
                          <span className={`text-xs font-bold ${r.item_received ? 'text-leaf' : 'text-ink-soft'}`}>
                            {r.item_received ? 'Item received' : 'Item not received yet'}
                          </span>
                        </div>
                        <p className="text-ink-soft text-xs mt-1">{r.reason}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>

            <div className="grid gap-5 min-w-0">
              <Panel title="Customer">
                <div className="grid gap-1 text-sm">
                  <p className="font-semibold">{order.customer_name || '—'}</p>
                  {order.customer_email && <p className="text-ink-soft">{order.customer_email}</p>}
                  {order.customer_phone && <p className="text-ink-soft num">{order.customer_phone}</p>}
                </div>
              </Panel>

              <Panel title={order.delivery_type === 'store_pickup' ? 'Fulfilment' : 'Shipping address'}>
                {order.delivery_type === 'store_pickup' ? (
                  <p className="text-sm text-ink-soft">Store pickup - no delivery address.</p>
                ) : address ? (
                  <div className="text-sm grid gap-0.5">
                    <p className="font-semibold">{address.full_name}</p>
                    <p>{address.address_line1}</p>
                    {address.address_line2 && <p>{address.address_line2}</p>}
                    {address.landmark && <p>{address.landmark}</p>}
                    <p>
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="text-ink-soft num mt-1">{address.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-ink-soft">No address on file.</p>
                )}
                {order.estimated_delivery && (
                  <p className="text-xs text-ink-soft mt-3">
                    Estimated delivery: {shortDate(order.estimated_delivery)}
                  </p>
                )}
              </Panel>

              {order.tracking && (
                <Panel title="Tracking">
                  <div className="text-sm grid gap-1">
                    <p>
                      <span className="text-ink-soft">Courier: </span>
                      {order.tracking.provider || '—'}
                    </p>
                    <p className="num">
                      <span className="text-ink-soft">Tracking id: </span>
                      {order.tracking.tracking_id}
                    </p>
                    {order.tracking.url && (
                      <a
                        href={order.tracking.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold underline mt-1"
                      >
                        Track shipment ↗
                      </a>
                    )}
                  </div>
                </Panel>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
