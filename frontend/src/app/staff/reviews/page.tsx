'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useModerateReview, useReviewQueue } from '@/hooks/useStaff';
import { EmptyState, ErrorState, Panel, StatusPill, shortDate } from '@/components/staff/ui';

export default function StaffReviewsPage() {
  const [pendingOnly, setPendingOnly] = useState(true);
  const { data, isLoading, isError } = useReviewQueue(pendingOnly);
  const moderate = useModerateReview();

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => setPendingOnly(e.target.checked)}
          />
          Awaiting moderation only
        </label>
        {data && (
          <span className="text-sm text-ink-soft">
            {data.pending_count} pending
          </span>
        )}
      </div>

      {data?.pending_count === 0 && pendingOnly && (
        <p className="text-sm text-ink-soft">
          Nothing waiting. Reviews publish immediately unless a staff member turns off
          auto-approve in Django Admin under Review config.
        </p>
      )}

      <Panel title={`Reviews${data ? ` · ${data.count}` : ''}`}>
        {isLoading ? (
          <p className="text-sm text-ink-soft py-6">Loading…</p>
        ) : isError ? (
          <ErrorState />
        ) : !data?.results.length ? (
          <EmptyState message="No reviews to show." />
        ) : (
          <ul className="grid gap-4">
            {data.results.map((r) => (
              <li key={r.id} className="border border-line p-4 grid gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="num font-bold" aria-label={`${r.rating} out of 5`}>
                    {'★'.repeat(r.rating)}
                    <span className="text-ink-soft">{'★'.repeat(5 - r.rating)}</span>
                  </span>
                  <Link
                    href={`/products/${r.product_slug}`}
                    className="text-sm font-bold hover:underline"
                  >
                    {r.product}
                  </Link>
                  <StatusPill
                    value={r.is_approved ? 'approved' : 'requested'}
                    label={r.is_approved ? 'Published' : 'Pending'}
                  />
                  {r.is_verified_purchase && (
                    <StatusPill value="ok" label="Verified purchase" />
                  )}
                  <span className="text-xs text-ink-soft ml-auto whitespace-nowrap">
                    {r.user} · {shortDate(r.created_at)}
                  </span>
                </div>

                {r.text && <p className="text-sm">{r.text}</p>}

                <div className="flex gap-3">
                  {!r.is_approved && (
                    <button
                      onClick={() => moderate.mutate({ reviewId: r.id, action: 'approve' })}
                      disabled={moderate.isPending}
                      className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-3.5 py-1.5 disabled:opacity-50"
                    >
                      Publish
                    </button>
                  )}
                  {r.is_approved && (
                    <button
                      onClick={() => moderate.mutate({ reviewId: r.id, action: 'reject' })}
                      disabled={moderate.isPending}
                      className="border border-line text-xs font-bold px-3.5 py-1.5 disabled:opacity-50"
                    >
                      Unpublish
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
