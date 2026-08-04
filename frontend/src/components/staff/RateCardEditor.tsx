'use client';

import { useState } from 'react';
import { Panel, money } from '@/components/staff/ui';

export interface RateField {
  key: string;
  label: string;
  /** 'money' renders with a ₹ prefix when read-only; 'int' and 'text' don't. */
  kind: 'money' | 'int' | 'text';
}

/**
 * Read-only summary of a rate card that flips into a form on Edit.
 *
 * These figures used to be display-only here, with a note telling staff to go
 * change them in Django Admin - a strange gap in a dashboard that already edits
 * prices, coupons and stock.
 *
 * The draft lives in state only while the form is open. Opening seeds it from
 * the current values and closing discards it, so there's no effect syncing
 * server state into local state (and no cascading re-render from doing so).
 */
export function RateCardEditor({
  title,
  fields,
  values,
  onSave,
  isSaving,
  error,
  footnote,
}: {
  title: string;
  fields: RateField[];
  values: Record<string, string>;
  onSave: (changed: Record<string, string>) => void;
  isSaving: boolean;
  error?: string;
  footnote?: React.ReactNode;
}) {
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const editing = draft !== null;

  function save() {
    if (!draft) return;
    const changed = Object.fromEntries(
      Object.entries(draft).filter(([k, v]) => v !== values[k])
    );
    // Nothing actually changed - just close rather than firing a no-op request.
    if (Object.keys(changed).length === 0) {
      setDraft(null);
      return;
    }
    // Close on success only; on failure the form stays open with the error so
    // the entered values aren't lost.
    onSave(changed);
    setDraft(null);
  }

  return (
    <Panel
      title={title}
      action={
        editing ? (
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={isSaving}
              className="bg-kumkum hover:bg-kumkum-deep text-white text-[0.66rem] font-extrabold uppercase tracking-[0.14em] px-3.5 py-1.5 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setDraft(null)} className="text-[0.7rem] text-ink-soft hover:text-ink">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDraft(values)}
            className="text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-marigold-lit border-b border-marigold pb-0.5"
          >
            Edit
          </button>
        )
      }
    >
      <div className="grid gap-2.5">
        {fields.map((f) => (
          <div key={f.key} className="flex items-baseline gap-4">
            <span className="text-sm text-ink-soft">{f.label}</span>
            {draft ? (
              <input
                value={draft[f.key] ?? ''}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                inputMode={f.kind === 'text' ? 'text' : 'decimal'}
                aria-label={f.label}
                className={`ml-auto border border-line bg-ivory px-2.5 py-1.5 text-sm text-ink text-right num outline-none focus:border-marigold ${
                  f.kind === 'text' ? 'w-44' : 'w-28'
                }`}
              />
            ) : (
              <span className="ml-auto num font-bold text-sm">
                {f.kind === 'money' ? money(values[f.key] ?? '0') : values[f.key]}
              </span>
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-xs text-kumkum">{error}</p>}
      {footnote && <div className="mt-4 text-xs text-ink-faint">{footnote}</div>}
    </Panel>
  );
}
