'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalSearch } from '@/hooks/useStaff';
import { money, StatusPill } from '@/components/staff/ui';

/** One search box across products and orders, in the header of every staff
 * page - every list page had its own separate search field before this, so
 * finding "was there an order from this phone number" meant already knowing
 * to go to the Orders page first. */
export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useGlobalSearch(debounced);
  const hasResults = !!data && (data.products.length > 0 || data.orders.length > 0);
  const showDropdown = open && debounced.trim().length >= 2;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function goToProduct(sku: string) {
    setOpen(false);
    setQuery('');
    router.push(`/staff/inventory?search=${encodeURIComponent(sku)}`);
  }

  function goToOrder(orderId: string) {
    setOpen(false);
    setQuery('');
    router.push(`/staff/orders/${orderId}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Search products, orders…"
        className="w-full border border-line bg-card px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-marigold"
      />
      {showDropdown && (
        <div className="absolute right-0 z-20 mt-1.5 w-[340px] max-h-[420px] overflow-y-auto border border-line bg-card shadow-lg">
          {isFetching && !data ? (
            <p className="p-4 text-sm text-ink-soft">Searching…</p>
          ) : !hasResults ? (
            <p className="p-4 text-sm text-ink-soft">No matches for &quot;{debounced}&quot;.</p>
          ) : (
            <>
              {data!.products.length > 0 && (
                <div>
                  <p className="eyebrow px-4 pt-3 pb-1.5">Products</p>
                  {data!.products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => goToProduct(p.sku)}
                      className="flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left text-sm hover:bg-ivory-raised"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-ink-soft num">
                        {p.sku}
                        {p.category ? ` · ${p.category}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {data!.orders.length > 0 && (
                <div className="border-t border-line">
                  <p className="eyebrow px-4 pt-3 pb-1.5">Orders</p>
                  {data!.orders.map((o) => (
                    <button
                      key={o.order_id}
                      onClick={() => goToOrder(o.order_id)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-ivory-raised"
                    >
                      <span className="font-bold num">{o.order_id}</span>
                      <StatusPill value={o.status} />
                      <span className="ml-auto text-xs text-ink-soft num">{money(o.total)}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
