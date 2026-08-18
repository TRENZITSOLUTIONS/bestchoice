import { mediaUrl } from '@/lib/format';
import type { RefundAttachment } from '@/lib/staff-types';

/** Thumbnails/links for whatever a customer attached to a refund request -
 * shared between the refunds table and the staff order-detail page so
 * staff can actually look at the proof before approving or rejecting. */
export function RefundProof({ attachments }: { attachments: RefundAttachment[] }) {
  if (!attachments.length) return <span className="text-xs text-ink-faint">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {attachments.map((a) =>
        a.kind === 'photo' ? (
          <a key={a.id} href={mediaUrl(a.file)} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl(a.file)} alt="" className="h-10 w-10 object-cover border border-line rounded" />
          </a>
        ) : (
          <a
            key={a.id}
            href={mediaUrl(a.file)}
            target="_blank"
            rel="noreferrer"
            className="h-10 w-10 flex items-center justify-center border border-line rounded text-sm"
            aria-label="View video"
          >
            🎥
          </a>
        )
      )}
    </div>
  );
}
