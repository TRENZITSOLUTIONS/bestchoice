'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterSidebar } from './FilterSidebar';

/** Every URL param FilterSidebar can set - used to badge how many are active
 * and to clear them all at once. Keep in sync with FilterSidebar's own keys. */
const FILTER_PARAMS = [
  'category', 'brand', 'price_gte', 'price_lte', 'discount', 'color',
  'fabric', 'fit', 'sleeve_type', 'occasion', 'skin_type', 'compatible_device',
  'availability',
];

/**
 * The old layout put the full filter sidebar - a dozen collapsible groups -
 * directly above the product grid on mobile, so a phone visitor had to
 * scroll past a wall of checkboxes before seeing a single product. This
 * swaps that for the standard mobile shopping pattern instead: a small
 * "Filters" button that opens the same filters in a bottom sheet, so the
 * product grid is the first thing on screen.
 */
export function MobileFilters({ inferredCategorySlug }: { inferredCategorySlug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  // Body scroll would otherwise fight the sheet's own internal scroll.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const activeCount = FILTER_PARAMS.filter((key) => searchParams.get(key)).length;

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_PARAMS.forEach((key) => params.delete(key));
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-line rounded px-3.5 py-2 text-sm font-semibold"
      >
        <span aria-hidden>⚙</span>
        Filters
        {activeCount > 0 && (
          <span className="bg-kumkum text-white rounded-full text-[0.65rem] font-extrabold w-4.5 h-4.5 grid place-items-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-2xl bg-card">
            <div className="flex items-center gap-3 border-b border-line px-5 py-4 shrink-0">
              <h2 className="font-bold">Filters</h2>
              {activeCount > 0 && (
                <button type="button" onClick={clearAll} className="text-sm font-bold text-kumkum-deep">
                  Clear all
                </button>
              )}
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setOpen(false)}
                className="ml-auto text-xl leading-none text-ink-soft"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-1">
              <FilterSidebar inferredCategorySlug={inferredCategorySlug} className="text-sm" />
            </div>
            <div className="border-t border-line p-4 shrink-0">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm py-3 rounded"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
