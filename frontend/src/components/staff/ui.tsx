'use client';

/** Shared building blocks for the staff dashboard, so every screen reads the same. */

const STATUS_TONES: Record<string, string> = {
  // Order status
  pending: 'bg-marigold/15 text-marigold border-marigold/30',
  confirmed: 'bg-marigold/15 text-marigold border-marigold/30',
  packed: 'bg-marigold/15 text-marigold border-marigold/30',
  shipped: 'bg-kumkum/15 text-kumkum-deep border-kumkum/30',
  delivered: 'bg-leaf/15 text-leaf border-leaf/30',
  cancelled: 'bg-ink-soft/10 text-ink-soft border-line',
  // Payment status
  paid: 'bg-leaf/15 text-leaf border-leaf/30',
  refunded: 'bg-ink-soft/10 text-ink-soft border-line',
  failed: 'bg-kumkum/15 text-kumkum-deep border-kumkum/30',
  // Refund status
  requested: 'bg-marigold/15 text-marigold border-marigold/30',
  approved: 'bg-leaf/15 text-leaf border-leaf/30',
  rejected: 'bg-ink-soft/10 text-ink-soft border-line',
  processed: 'bg-leaf/15 text-leaf border-leaf/30',
  // Stock state
  out: 'bg-kumkum/15 text-kumkum-deep border-kumkum/30',
  low: 'bg-marigold/15 text-marigold border-marigold/30',
  ok: 'bg-leaf/15 text-leaf border-leaf/30',
};

export function StatusPill({ value, label }: { value: string; label?: string }) {
  const tone = STATUS_TONES[value] ?? 'bg-ink-soft/10 text-ink-soft border-line';
  return (
    <span
      className={`inline-block border rounded-full px-2.5 py-0.5 text-xs font-bold capitalize whitespace-nowrap ${tone}`}
    >
      {label ?? value.replace(/_/g, ' ')}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'attention' | 'good';
}) {
  const accent =
    tone === 'attention' ? 'text-kumkum-deep' : tone === 'good' ? 'text-leaf' : '';
  return (
    <div className="border border-line rounded bg-card p-4">
      <p className="eyebrow mb-1.5">{label}</p>
      <p className={`display text-2xl num ${accent}`}>{value}</p>
      {hint && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-line rounded bg-card">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-line">
        <h2 className="font-bold text-sm">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Wide tables must scroll inside their own box, never the page. */
export function TableScroll({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto -mx-4 px-4">{children}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-ink-soft py-8 text-center">{message}</p>;
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <p className="text-sm text-kumkum py-8 text-center">
      {message ?? 'Could not load this. Try reloading the page.'}
    </p>
  );
}

export function money(value: string | number) {
  const n = Number(value);
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Minimal inline bar chart. Deliberately not a charting dependency. */
export function Sparkbars({
  points,
}: {
  points: { date: string; revenue: string; orders: number }[];
}) {
  const max = Math.max(...points.map((p) => Number(p.revenue)), 1);
  return (
    <div className="flex items-end gap-1.5 h-28" role="img" aria-label="Revenue by day">
      {points.map((p) => {
        const value = Number(p.revenue);
        const height = value > 0 ? Math.max(4, (value / max) * 100) : 2;
        return (
          <div key={p.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className={`w-full rounded-t ${value > 0 ? 'bg-kumkum' : 'bg-line'}`}
              style={{ height: `${height}%` }}
              title={`${shortDate(p.date)} — ${money(value)} (${p.orders} orders)`}
            />
            <span className="text-[10px] text-ink-soft truncate w-full text-center">
              {new Date(p.date).getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
