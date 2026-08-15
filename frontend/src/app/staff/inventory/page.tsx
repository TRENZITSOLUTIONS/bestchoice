'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  useBulkProductAction,
  useCreateProduct,
  useDeleteProduct,
  useInventory,
  useUpdateProduct,
} from '@/hooks/useStaff';
import { useCategories, useBrands } from '@/hooks/useProducts';
import {
  EmptyState,
  ErrorState,
  Panel,
  StatusPill,
  TableScroll,
  money,
} from '@/components/staff/ui';
import {
  CLOTHING_DEPARTMENT_SLUGS,
  EMPTY_PRODUCT_DRAFT,
  ProductDetailsFields,
  ProductPricingFields,
  ProductOrganizationFields,
  ProductStatusFields,
  ProductCosmeticsFields,
  ProductClothingFields,
  ProductMobileAccessoryFields,
  departmentSlugFor,
  draftFromRow,
  draftToPayload,
  flattenCategories,
  type ProductDraft,
} from '@/components/staff/ProductForm';
import { ImageManager } from '@/components/staff/ImageManager';
import { VariantManager } from '@/components/staff/VariantManager';
import type { InventoryRow } from '@/lib/staff-types';

const inputClass = 'border border-line bg-card px-3 py-2 text-sm outline-none focus:border-marigold';

function firstError(err: unknown): string | undefined {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return err ? 'Could not save that product.' : undefined;
  const [field, msg] = Object.entries(data)[0] ?? [];
  if (!field) return 'Could not save that product.';
  return `${field}: ${Array.isArray(msg) ? msg.join(' ') : String(msg)}`;
}

function StaffInventoryPageContent() {
  const searchParams = useSearchParams();
  // Seeded from the URL so the Overview page's "Out of stock" stat card and
  // the header's global search both land here already filtered, not on the
  // unfiltered list.
  const [filters, setFilters] = useState({
    search: searchParams.get('search') ?? '',
    category: '',
    brand: '',
    status: '',
  });
  const [outOnly, setOutOnly] = useState(searchParams.get('out_of_stock') === 'true');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_PRODUCT_DRAFT);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');

  const { data, isLoading, isError } = useInventory({
    ...filters,
    out_of_stock: outOnly ? 'true' : '',
    page: String(page),
  });
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const categoryOptions = categories ? flattenCategories(categories) : [];
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const bulkAction = useBulkProductAction();
  const saving = createProduct.isPending || updateProduct.isPending;
  const saveError = createProduct.isError
    ? firstError(createProduct.error)
    : updateProduct.isError
      ? firstError(updateProduct.error)
      : undefined;

  function patchDraft(patch: Partial<ProductDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function setFilter(key: keyof typeof filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setSelected([]);
  }

  function handleBulkAction(action: 'activate' | 'deactivate' | 'delete') {
    if (action === 'delete') {
      const ok = confirm(
        `Delete ${selected.length} product${selected.length === 1 ? '' : 's'}? This removes their photos and variants too - past orders keep their own record and are not affected. This cannot be undone.`
      );
      if (!ok) return;
    }
    setBulkMessage('');
    bulkAction.mutate(
      { ids: selected, action },
      {
        onSuccess: (res) => {
          const verb = action === 'delete' ? 'Deleted' : action === 'activate' ? 'Made visible' : 'Hidden';
          setBulkMessage(`${verb} ${res.updated} product${res.updated === 1 ? '' : 's'}.`);
          setSelected([]);
        },
        onError: () => setBulkMessage('Could not update those products.'),
      }
    );
  }

  function startCreate() {
    setEditing('new');
    setDraft(EMPTY_PRODUCT_DRAFT);
  }

  function startEdit(row: InventoryRow) {
    setEditing(row.id);
    setDraft(draftFromRow(row));
  }

  function cancel() {
    setEditing(null);
    createProduct.reset();
    updateProduct.reset();
  }

  function deleteRow(row: InventoryRow) {
    if (!confirm(`Delete "${row.name}" (${row.sku})? This removes its photos and variants too - past orders keep their own record and are not affected. This cannot be undone.`)) {
      return;
    }
    deleteProduct.mutate(row.id, {
      onSuccess: () => {
        if (editing === row.id) setEditing(null);
      },
    });
  }

  function save(hasVariants: boolean) {
    const payload = draftToPayload(draft);
    if (editing === 'new') {
      // Stay open on the freshly-made product instead of closing the panel -
      // staff almost always want to add a photo or a variant right after,
      // and re-finding it in the table to click Edit again is a step nobody
      // wants after just filling in the same form once.
      createProduct.mutate(payload, {
        onSuccess: (created) => setEditing(created.id),
      });
    } else if (editing !== null) {
      // Stock is derived from variants once a product has any - sending it
      // back would fight the denormalisation that keeps it in sync.
      const { total_stock, ...rest } = payload;
      const fields = hasVariants ? rest : { ...rest, total_stock };
      updateProduct.mutate({ id: editing, ...fields }, { onSuccess: () => setEditing(null) });
    }
  }

  const editingRow = editing !== null && editing !== 'new'
    ? data?.results.find((r) => r.id === editing)
    : undefined;
  const hasVariants = !!editingRow && editingRow.variant_count > 0;

  // Clothing is the one department where "size" is a real choice a shopper
  // has to make before they can buy - a shirt with no size variant isn't
  // actually purchasable in a meaningful way, even though the system allows
  // saving it. Some clothing-department products genuinely have no size
  // (a scarf, a bindi filed under "Others"), so this warns rather than
  // blocking the save.
  const department = categories && draft.category
    ? departmentSlugFor(categories, Number(draft.category))
    : null;
  const needsSizeWarning =
    !!department && CLOTHING_DEPARTMENT_SLUGS.has(department) && draft.is_active && !hasVariants;

  return (
    <div className="grid gap-5">
      {editing === null ? (
        <Panel
          title="Add a product"
          action={
            <button
              onClick={startCreate}
              className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-3.5 py-1.5"
            >
              New product
            </button>
          }
        >
          <p className="text-sm text-ink-soft">Add new stock, or pick a row below to edit it.</p>
        </Panel>
      ) : (
        // min-w-0: this whole block is itself a grid item of the page's
        // outer single-column grid above. Without min-w-0 here too, the
        // Variants table's min-w-[640px] still bubbles all the way up to
        // this level and blows out the page on mobile, even though the
        // inner two-column grid's own children already have min-w-0.
        <div className="grid gap-5 min-w-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
            <div>
              <p className="eyebrow mb-1">{editing === 'new' ? 'New product' : 'Editing product'}</p>
              <h2 className="text-lg font-bold tracking-tight">
                {draft.name || 'Untitled product'}
              </h2>
              {editingRow && (
                <p className="text-xs text-ink-soft num mt-0.5">
                  {editingRow.product_id} · {editingRow.sku}
                </p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => save(hasVariants)}
                disabled={saving}
                className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-4 py-2 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={cancel} className="text-xs font-bold text-ink-soft hover:text-ink">
                Cancel
              </button>
              {typeof editing === 'number' && editingRow && (
                <button
                  onClick={() => deleteRow(editingRow)}
                  disabled={deleteProduct.isPending}
                  className="text-xs font-bold text-kumkum hover:text-kumkum-deep disabled:opacity-50"
                >
                  {deleteProduct.isPending ? 'Deleting…' : 'Delete product'}
                </button>
              )}
            </div>
          </div>
          {saveError && <p className="text-sm text-kumkum">{saveError}</p>}
          {deleteProduct.isError && (
            <p className="text-sm text-kumkum">Could not delete that product.</p>
          )}

          {typeof editing === 'number' && (
            <Panel title="Photos">
              <ImageManager productId={editing} />
            </Panel>
          )}

          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            {/* min-w-0 matters here: without it, the Variants table's
                min-w-[640px] (needed for its own horizontal scroll) instead
                forces this whole grid track wider than the viewport, and
                everything on the page scrolls sideways on mobile - the
                table wants to be scrollable *within* itself, not blow out
                the column around it. */}
            <div className="grid gap-5 min-w-0">
              <Panel title="Details">
                <ProductDetailsFields draft={draft} onChange={patchDraft} />
              </Panel>
              {department === 'cosmetics' && (
                <Panel title="Cosmetics details">
                  <ProductCosmeticsFields draft={draft} onChange={patchDraft} />
                </Panel>
              )}
              {department && CLOTHING_DEPARTMENT_SLUGS.has(department) && (
                <Panel title="Clothing details">
                  <ProductClothingFields draft={draft} onChange={patchDraft} />
                </Panel>
              )}
              {department === 'mobile-accessories' && (
                <Panel title="Mobile accessory details">
                  <ProductMobileAccessoryFields draft={draft} onChange={patchDraft} />
                </Panel>
              )}
              {typeof editing === 'number' ? (
                <Panel title="Variants">
                  {needsSizeWarning && (
                    <p className="text-xs text-marigold border border-marigold/40 bg-marigold/10 px-3 py-2.5 mb-3.5">
                      <strong>No size added yet.</strong> This is a Men&apos;s/Women&apos;s/Kids&apos; Wear
                      product marked &quot;Visible to shoppers&quot; with no variants - shoppers won&apos;t
                      see a size option and can add it to cart without choosing one. Add at least one
                      variant below with a size before customers should be able to buy it. (If this
                      product genuinely has no size - e.g. a scarf or an accessory - you can ignore this.)
                    </p>
                  )}
                  <VariantManager productId={editing} categoryId={draft.category ? Number(draft.category) : null} />
                </Panel>
              ) : (
                <Panel title="Variants">
                  {needsSizeWarning && (
                    <p className="text-xs text-marigold border border-marigold/40 bg-marigold/10 px-3 py-2.5 mb-3.5">
                      <strong>Heads up:</strong> this is a Men&apos;s/Women&apos;s/Kids&apos; Wear product
                      marked &quot;Visible to shoppers&quot;. Once saved, add at least one variant with a
                      size below - otherwise shoppers can add it to cart without ever choosing one.
                    </p>
                  )}
                  <p className="text-sm text-ink-soft">Save the product first to add variants.</p>
                </Panel>
              )}
            </div>
            <div className="grid gap-5 min-w-0">
              <Panel title="Status">
                <ProductStatusFields draft={draft} onChange={patchDraft} hasVariants={hasVariants} />
              </Panel>
              <Panel title="Pricing">
                <ProductPricingFields draft={draft} onChange={patchDraft} />
              </Panel>
              <Panel title="Organization">
                <ProductOrganizationFields draft={draft} onChange={patchDraft} />
              </Panel>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 items-center">
        <input
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Product name or id"
          className={`${inputClass} min-w-[200px] flex-1`}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
          className={inputClass}
        >
          <option value="">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select
          value={filters.brand}
          onChange={(e) => setFilter('brand', e.target.value)}
          className={inputClass}
        >
          <option value="">All brands</option>
          {brands?.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className={inputClass}
        >
          <option value="">Active + inactive</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={outOnly}
            onChange={(e) => {
              setOutOnly(e.target.checked);
              setPage(1);
              setSelected([]);
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

      {selected.length > 0 && (
        <div className="border border-kumkum/30 bg-kumkum/5 p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold">{selected.length} selected</span>
          <button
            onClick={() => handleBulkAction('activate')}
            disabled={bulkAction.isPending}
            className="border border-line px-3 py-1.5 text-xs font-bold disabled:opacity-50"
          >
            Make visible
          </button>
          <button
            onClick={() => handleBulkAction('deactivate')}
            disabled={bulkAction.isPending}
            className="border border-line px-3 py-1.5 text-xs font-bold disabled:opacity-50"
          >
            Hide
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={bulkAction.isPending}
            className="border border-kumkum/40 text-kumkum px-3 py-1.5 text-xs font-bold disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={() => setSelected([])}
            className="ml-auto text-xs font-bold text-ink-soft hover:text-ink"
          >
            Clear
          </button>
        </div>
      )}
      {bulkMessage && <p className="text-sm text-leaf">{bulkMessage}</p>}

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
                    <th className="pb-2 w-8">
                      <input
                        type="checkbox"
                        aria-label="Select all products on this page"
                        checked={data.results.every((r) => selected.includes(r.id))}
                        onChange={(e) =>
                          setSelected(e.target.checked ? data.results.map((r) => r.id) : [])
                        }
                      />
                    </th>
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
                  {data.results.map((row) => (
                    <tr key={row.id} className={`border-t border-line ${editing === row.id ? 'bg-ivory-raised' : ''}`}>
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.name}`}
                          checked={selected.includes(row.id)}
                          onChange={(e) =>
                            setSelected((s) =>
                              e.target.checked ? [...s, row.id] : s.filter((id) => id !== row.id)
                            )
                          }
                        />
                      </td>
                      <td className="py-2.5">
                        <Link href={`/products/${row.slug}`} className="font-bold hover:underline">
                          {row.name}
                        </Link>
                        <span className="block text-xs text-ink-soft num">
                          {row.product_id} · {row.sku}
                        </span>
                      </td>
                      <td className="py-2.5 text-ink-soft">{row.category ?? '—'}</td>
                      <td className="py-2.5 num">{row.variant_count}</td>
                      <td className="py-2.5 text-right num">{money(row.selling_price)}</td>
                      <td
                        className="py-2.5 text-right pr-4 num"
                        title={row.variant_count > 0 ? 'Sum of variant stock' : undefined}
                      >
                        {row.total_stock}
                      </td>
                      <td className="py-2.5 pl-2">
                        <StatusPill
                          value={row.is_active ? row.stock_state : 'cancelled'}
                          label={row.is_active ? undefined : 'Inactive'}
                        />
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <button onClick={() => startEdit(row)} className="text-xs font-bold underline">
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRow(row)}
                          className="ml-3 text-xs text-kumkum underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>

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

export default function StaffInventoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft py-6">Loading…</p>}>
      <StaffInventoryPageContent />
    </Suspense>
  );
}
