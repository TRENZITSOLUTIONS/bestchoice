'use client';

import { useAnnouncements } from '@/hooks/useAnnouncements';

// Shown while the real list loads and if the request fails, so a slow or
// down API never means a blank strip above the header. An empty result once
// loaded (staff cleared every message) is treated as "hide the ticker" -
// distinct from not having loaded yet.
const FALLBACK_MESSAGES = [
  'Free delivery on orders above ₹500',
  'Store pickup at Spencer Plaza, Chennai',
  '7-day easy returns',
  'Earn Best Choice Rewards on every order',
  '2–4 business day delivery across Tamil Nadu',
];

function TickerContent({ messages, hidden }: { messages: string[]; hidden?: boolean }) {
  return (
    <div className="ticker-track flex items-center" aria-hidden={hidden}>
      {messages.map((msg, i) => (
        <span key={i} className="inline-flex items-center gap-4 px-7 whitespace-nowrap">
          {msg}
          <span aria-hidden className="w-[3px] h-[3px] rotate-45 bg-marigold shrink-0" />
        </span>
      ))}
    </div>
  );
}

export function AnnouncementTicker() {
  const { data, isLoading, isError } = useAnnouncements();

  const messages = !isLoading && !isError && data ? data.map((m) => m.text) : FALLBACK_MESSAGES;
  if (messages.length === 0) return null;

  return (
    <div className="bg-sunken border-b border-line overflow-hidden py-2.5 group relative z-30">
      <div className="ticker-viewport flex w-max text-[0.7rem] tracking-[0.16em] uppercase text-ink-soft">
        {/* Real copy, readable once by screen readers. The duplicate below is
            purely visual (seamless loop) and hidden from assistive tech. */}
        <TickerContent messages={messages} />
        <TickerContent messages={messages} hidden />
      </div>
    </div>
  );
}
