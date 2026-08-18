'use client';

import { use, useRef, useState } from 'react';
import Link from 'next/link';
import { useOrder, useOrderTracking, useCancelOrder, useRequestRefund } from '@/hooks/useOrders';
import { AccountNav } from '@/components/account/AccountNav';
import { mediaUrl } from '@/lib/format';

const CANCELLABLE_STATUSES = new Set(['pending', 'confirmed', 'packed']);

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrder(id);
  const { data: tracking } = useOrderTracking(id);
  const cancelOrder = useCancelOrder();
  const requestRefund = useRequestRefund();
  const [refundReason, setRefundReason] = useState('');
  const [refundPhotos, setRefundPhotos] = useState<File[]>([]);
  const [refundVideo, setRefundVideo] = useState<File | null>(null);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  function resetRefundForm() {
    setRefundReason('');
    setRefundPhotos([]);
    setRefundVideo(null);
    setShowRefundForm(false);
  }

  if (isLoading) return <p className="text-center py-20 text-ink-soft">Loading...</p>;
  if (!order) return <p className="text-center py-20 text-ink-soft">Order not found.</p>;

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-7">
      <h1 className="display text-2xl mb-6">Order {order.order_id}</h1>
      <div className="grid sm:grid-cols-[200px_1fr] gap-8">
        <AccountNav />
        <div>
          <div className="flex justify-between items-center border border-line rounded p-4.5 mb-5">
            <div>
              <p className="font-semibold capitalize">{order.status}</p>
              <p className="text-xs text-ink-soft mt-0.5">Payment: {order.payment_status}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/account/orders/${order.order_id}/invoice`}
                className="border border-line rounded px-4 py-2 text-sm font-semibold"
              >
                Print Invoice
              </Link>
              {CANCELLABLE_STATUSES.has(order.status) && (
                <button
                  onClick={() => cancelOrder.mutate(order.order_id)}
                  disabled={cancelOrder.isPending}
                  className="border border-line rounded px-4 py-2 text-sm font-semibold"
                >
                  Cancel Order
                </button>
              )}
              {order.status === 'delivered' && (
                <button
                  onClick={() => setShowRefundForm((v) => !v)}
                  className="border border-line rounded px-4 py-2 text-sm font-semibold"
                >
                  Request Refund
                </button>
              )}
            </div>
          </div>

          {showRefundForm && (
            <div className="border border-line rounded p-4.5 mb-5">
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refund"
                className="w-full border border-line rounded p-3 text-sm bg-card min-h-[70px] mb-3"
              />

              <p className="text-xs font-bold text-ink-soft mb-2">
                Photos (as many as you need) and a video (optional) help us process this faster.
              </p>

              {refundPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {refundPhotos.map((photo, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(photo)}
                        alt=""
                        className="h-16 w-16 object-cover border border-line rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setRefundPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label={`Remove ${photo.name}`}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center bg-kumkum text-white text-xs rounded-full"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {refundVideo && (
                <div className="flex items-center gap-2 text-xs mb-2.5 border border-line rounded px-3 py-2 w-fit">
                  <span>🎥 {refundVideo.name} ({(refundVideo.size / (1024 * 1024)).toFixed(1)}MB)</span>
                  <button
                    type="button"
                    onClick={() => setRefundVideo(null)}
                    aria-label="Remove video"
                    className="text-kumkum font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex gap-4 mb-3">
                <button
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  className="text-xs font-bold text-kumkum-deep"
                >
                  + Add photos
                </button>
                <button
                  type="button"
                  onClick={() => videoInput.current?.click()}
                  disabled={!!refundVideo}
                  className="text-xs font-bold text-kumkum-deep disabled:opacity-40"
                >
                  + Add video
                </button>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setRefundPhotos((prev) => [...prev, ...files]);
                    e.target.value = '';
                  }}
                />
                <input
                  ref={videoInput}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setRefundVideo(file);
                    e.target.value = '';
                  }}
                />
              </div>

              {requestRefund.isError && (
                <p className="text-xs text-kumkum mb-3">Could not submit that - check your photos/video and try again.</p>
              )}

              <button
                onClick={() =>
                  requestRefund.mutate(
                    { orderId: order.order_id, reason: refundReason, photos: refundPhotos, video: refundVideo },
                    { onSuccess: resetRefundForm }
                  )
                }
                disabled={requestRefund.isPending}
                className="bg-kumkum text-white font-bold text-sm rounded px-5 py-2.5 disabled:opacity-50"
              >
                {requestRefund.isPending ? 'Submitting…' : 'Submit Refund Request'}
              </button>
            </div>
          )}

          {tracking && tracking.status_history.length > 0 && (
            <div className="border border-line rounded p-4.5 mb-5">
              <h3 className="font-bold mb-3.5">Order Tracking</h3>
              <div className="grid gap-3.5">
                {tracking.status_history.map((h, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-kumkum mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold capitalize">{h.status}</p>
                      <p className="text-ink-soft text-xs">{h.note} · {new Date(h.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-line rounded p-4.5 mb-5">
            <h3 className="font-bold mb-3.5">Items</h3>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-2 border-b border-line last:border-0">
                <span>{item.product_snapshot.name} × {item.quantity}</span>
                <span className="num">₹{item.price}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-3 mt-1">
              <span className="text-ink-soft">Subtotal</span>
              <span className="num">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-ink-soft">Delivery</span>
              <span className="num">₹{order.delivery_charge}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-ink-soft">Discount</span>
                <span className="num">−₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold border-t border-line mt-1 pt-3">
              <span>Total</span>
              <span className="num">₹{order.total}</span>
            </div>
          </div>

          {order.refunds.length > 0 && (
            <div className="border border-line rounded p-4.5">
              <h3 className="font-bold mb-3.5">Refunds</h3>
              {order.refunds.map((r) => (
                <div key={r.id} className="text-sm py-2">
                  <p className="font-semibold capitalize">{r.status} · ₹{r.amount}</p>
                  <p className="text-ink-soft text-xs">{r.reason}</p>
                  {r.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {r.attachments.map((a) =>
                        a.kind === 'photo' ? (
                          <a key={a.id} href={mediaUrl(a.file)} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={mediaUrl(a.file)}
                              alt=""
                              className="h-14 w-14 object-cover border border-line rounded"
                            />
                          </a>
                        ) : (
                          <a
                            key={a.id}
                            href={mediaUrl(a.file)}
                            target="_blank"
                            rel="noreferrer"
                            className="h-14 w-14 flex items-center justify-center border border-line rounded text-xl"
                          >
                            🎥
                          </a>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
