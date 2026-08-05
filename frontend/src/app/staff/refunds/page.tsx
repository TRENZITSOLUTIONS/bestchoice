'use client';

import { useState } from 'react';
import { useStaffRefunds, useUpdateRefundStatus } from '@/hooks/useStaff';
import {
  EmptyState,
  ErrorState,
  Panel,
  StatusPill,
  TableScroll,
  money,
  shortDate,
} from '@/components/staff/ui';

export default function StaffRefundsPage() {
  const [filter, setFilter] = useState('requested');
  const [confirming, setConfirming] = useState<{ id: number; action: string } | null>(null);
  const [message, setMessage] = useState('');

  const { data, isLoading, isError } = useStaffRefunds(filter);
  const updateRefund = useUpdateRefundStatus();

  function act(refundId: number, status: string) {
    setMessage('');
    updateRefund.mutate(
      { refundId, status },
      {
        onSuccess: () => {
          setConfirming(null);
          setMessage(
            status === 'approved'
              ? 'Refund approved — Razorpay refund attempted and loyalty points reversed.'
              : `Refund marked ${status}.`
          );
        },
        onError: () => setMessage('Could not update that refund.'),
      }
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2.5 items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-line px-3 py-2 bg-card text-sm"
        >
          <option value="">All refunds</option>
          {['requested', 'approved', 'rejected', 'processed'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {message && <p className="text-sm text-leaf">{message}</p>}

      <Panel title={`Refunds${data ? ` · ${data.count}` : ''}`}>
        {isLoading ? (
          <p className="text-sm text-ink-soft py-6">Loading…</p>
        ) : isError ? (
          <ErrorState />
        ) : !data?.results.length ? (
          <EmptyState message="Nothing here." />
        ) : (
          <TableScroll>
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-left text-ink-soft">
                  <th className="font-medium pb-2">Requested</th>
                  <th className="font-medium pb-2">Order</th>
                  <th className="font-medium pb-2">Reason</th>
                  <th className="font-medium pb-2 text-right pr-4">Amount</th>
                  <th className="font-medium pb-2 pl-2">Status</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {data.results.map((r) => (
                  <tr key={r.id} className="border-t border-line align-top">
                    <td className="py-3 text-ink-soft whitespace-nowrap">
                      {shortDate(r.created_at)}
                    </td>
                    <td className="py-3 font-bold whitespace-nowrap">{r.order_id}</td>
                    <td className="py-3 max-w-[260px]">{r.reason}</td>
                    <td className="py-3 text-right pr-4 num font-bold whitespace-nowrap">
                      {money(r.amount)}
                    </td>
                    <td className="py-3 pl-2"><StatusPill value={r.status} /></td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {r.status === 'requested' &&
                        (confirming?.id === r.id ? (
                          <div className="grid gap-1.5 justify-items-end">
                            <p className="text-xs text-ink-soft max-w-[180px] text-right">
                              {confirming.action === 'approved'
                                ? 'This refunds the customer through Razorpay. It cannot be undone.'
                                : 'Reject this request?'}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => act(r.id, confirming.action)}
                                disabled={updateRefund.isPending}
                                className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-3 py-1.5 disabled:opacity-50"
                              >
                                {updateRefund.isPending ? 'Working…' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirming(null)}
                                className="text-xs text-ink-soft"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3 justify-end">
                            <button
                              onClick={() => setConfirming({ id: r.id, action: 'approved' })}
                              className="text-xs font-bold underline"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setConfirming({ id: r.id, action: 'rejected' })}
                              className="text-xs text-ink-soft underline"
                            >
                              Reject
                            </button>
                          </div>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>
    </div>
  );
}
