'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInventory, useUpdateProduct } from '@/hooks/useStaff';
import {
  EmptyState,
  ErrorState,
  Panel,
  StatusPill,
  TableScroll,
  money,
} from '@/components/staff/ui';

export default function StaffInventoryPage() {
  const [search, setSearch] = useState('');
  const [outOnly, setOutOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ selling_price: '', total_stock: '' });

  const { data, isLoading, isError } = useInventory({
    search,
    out_of_stock: outOnly ? 'true' : '',
    page: String(page),
  });
  const updateProduct = useUpdateProduct();

  function startEdit(row: { id: number; selling_price: string; total_stock: number }) {
    setEditing(row.id);
    setDraft({ selling_price: row.selling_price, total_stock: String(row.total_stock) });
  }

  function save(id: number, hasVariants: boolean) {
    const fields: Record<string, unknown> = { selling_price: draft.selling_price };
    // Stock is derived from variants when a product has them, so only send it
    // for variant-less products where it is the authoritative number.
    if (!hasVariants) fields.total_stock = Number(draft.total_stock);
    updateProduct.mutate({ id, ...fields }, { onSuccess: () => setEditing(null) });
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2.5 items-center">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Product name or id"
          className="border border-line px-3 py-2 bg-card text-sm min-w-[220px] flex-1"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={outOnly}
            onChange={(e) => {
              setOutOnly(e.target.checked);
              setPage(1);
            }}
          />
          Out of stock only
        </label>
        {data && data.out_of_stock_count > 0 && (
          <span className="text-sm text-kumkum-deep font-bold">
            {data.out_of_stock_count} out of stock
          </span>
        )}
      </div>

      <Panel title={`Inventory${data ? ` · ${data.count}` : ''}`}>
        {isLoading ? (
          <p className="text-sm text-ink-soft py-6">Loading…</p>
        ) : isError ? (
          <ErrorState />
        ) : !data?.results.length ? (
          <EmptyState message="No products match." />
        ) : (
          <>
            <TableScroll>
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="text-left text-ink-soft">
                    <th className="font-medium pb-2">Product</th>
                    <th className="font-medium pb-2">Category</th>
                    <th className="font-medium pb-2">Variants</th>
                    <th className="font-medium pb-2 text-right">Price</th>
                    <th className="font-medium pb-2 text-right pr-4">Stock</th>
                    <th className="font-medium pb-2 pl-2">State</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((row) => {
                    const isEditing = editing === row.id;
                    const hasVariants = row.variant_count > 0;
                    return (
                      <tr key={row.id} className="border-t border-line">
                        <td className="py-2.5">
                          <Link
                            href={`/products/${row.slug}`}
                            className="font-bold hover:underline"
                          >
                            {row.name}
                          </Link>
                          <span className="block text-xs text-ink-soft num">
                            {row.auto_product_id}
                          </span>
                        </td>
                        <td className="py-2.5 text-ink-soft">{row.category ?? '—'}</td>
                        <td className="py-2.5 num">{row.variant_count}</td>
                        <td className="py-2.5 text-right">
                          {isEditing ? (
                            <input
                              value={draft.selling_price}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, selling_price: e.target.value }))
                              }
                              className="border border-line px-2 py-1 bg-ivory text-sm w-24 text-right num"
                            />
                          ) : (
                            <span className="num">{money(row.selling_price)}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right pr-4">
                          {isEditing && !hasVariants ? (
                            <input
                              value={draft.total_stock}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, total_stock: e.target.value }))
                              }
                              className="border border-line px-2 py-1 bg-ivory text-sm w-20 text-right num"
                            />
                          ) : (
                            <span className="num" title={hasVariants ? 'Sum of variant stock' : undefined}>
                              {row.total_stock}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pl-2"><StatusPill value={row.stock_state} /></td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => save(row.id, hasVariants)}
                                disabled={updateProduct.isPending}
                                className="text-xs font-bold underline disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditing(null)}
                                className="text-xs text-ink-soft ml-3"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit(row)}
                              className="text-xs font-bold underline"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableScroll>

            <p className="text-xs text-ink-soft mt-3">
              Stock for products with variants is the sum of their variant stock — edit it on
              the variant in Django Admin.
            </p>

            {data.num_pages > 1 && (
              <div className="flex items-center gap-3 mt-4 text-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border border-line px-3 py-1.5 font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-ink-soft">Page {data.page} of {data.num_pages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(data.num_pages, p + 1))}
                  disabled={page >= data.num_pages}
                  className="border border-line px-3 py-1.5 font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
