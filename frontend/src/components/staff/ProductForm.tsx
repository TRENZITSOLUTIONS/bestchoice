'use client';

import { useCategories, useBrands } from '@/hooks/useProducts';
import type { InventoryRow } from '@/lib/staff-types';
import type { Category } from '@/lib/types';

export interface ProductDraft {
  name: string;
  category: string;
  brand: string;
  mrp: string;
  selling_price: string;
  total_stock: string;
  weight_g: string;
  short_description: string;
  description: string;
  is_active: boolean;
}

export const EMPTY_PRODUCT_DRAFT: ProductDraft = {
  name: '',
  category: '',
  brand: '',
  mrp: '',
  selling_price: '',
  total_stock: '0',
  weight_g: '500',
  short_description: '',
  description: '',
  is_active: true,
};

export function draftFromRow(row: InventoryRow): ProductDraft {
  return {
    name: row.name,
    category: row.category_id ? String(row.category_id) : '',
    brand: row.brand_id ? String(row.brand_id) : '',
    mrp: row.mrp,
    selling_price: row.selling_price,
    total_stock: String(row.total_stock),
    weight_g: String(row.weight_g),
    short_description: row.short_description,
    description: row.description,
    is_active: row.is_active,
  };
}

/** Every field the API accepts, converted to the shapes it expects. */
export function draftToPayload(draft: ProductDraft) {
  return {
    name: draft.name,
    category: draft.category ? Number(draft.category) : null,
    brand: draft.brand ? Number(draft.brand) : null,
    mrp: draft.mrp,
    selling_price: draft.selling_price,
    total_stock: Number(draft.total_stock),
    weight_g: Number(draft.weight_g),
    short_description: draft.short_description,
    description: draft.description,
    is_active: draft.is_active,
  };
}

/** Department name for a subcategory, or the department itself at the top level. */
export function flattenCategories(categories: Category[]) {
  return categories.flatMap((department) => [
    { id: department.id, label: department.name },
    ...department.children.map((sub) => ({ id: sub.id, label: `${department.name} › ${sub.name}` })),
  ]);
}

const inputClass =
  'border border-line bg-ivory px-3 py-2 text-sm text-ink outline-none focus:border-marigold';

export function ProductForm({
  draft,
  onChange,
  hasVariants,
  error,
}: {
  draft: ProductDraft;
  onChange: (draft: ProductDraft) => void;
  /** Stock is derived from variants once a product has any - editing it here would be overwritten. */
  hasVariants?: boolean;
  error?: string;
}) {
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const categoryOptions = categories ? flattenCategories(categories) : [];

  function field<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1">
          <span className="eyebrow">Name</span>
          <input
            required
            value={draft.name}
            onChange={(e) => field('name', e.target.value)}
            placeholder="Cotton Casual Shirt"
            className={inputClass}
          />
        </label>
        <label className="grid gap-1">
          <span className="eyebrow">Category</span>
          <select
            required
            value={draft.category}
            onChange={(e) => field('category', e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>Choose one</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="eyebrow">Brand (optional)</span>
          <select
            value={draft.brand}
            onChange={(e) => field('brand', e.target.value)}
            className={inputClass}
          >
            <option value="">No brand</option>
            {brands?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="eyebrow">MRP (₹)</span>
          <input
            required
            type="number"
            min="1"
            step="0.01"
            value={draft.mrp}
            onChange={(e) => field('mrp', e.target.value)}
            className={`${inputClass} num`}
          />
        </label>
        <label className="grid gap-1">
          <span className="eyebrow">Selling price (₹)</span>
          <input
            required
            type="number"
            min="1"
            step="0.01"
            value={draft.selling_price}
            onChange={(e) => field('selling_price', e.target.value)}
            className={`${inputClass} num`}
          />
        </label>
        <label className="grid gap-1">
          <span className="eyebrow">
            Stock{hasVariants ? ' (from variants)' : ''}
          </span>
          <input
            type="number"
            min="0"
            disabled={hasVariants}
            title={hasVariants ? 'This product has variants - edit their stock in the Variants section below.' : undefined}
            value={draft.total_stock}
            onChange={(e) => field('total_stock', e.target.value)}
            className={`${inputClass} num disabled:opacity-50`}
          />
        </label>
        <label className="grid gap-1">
          <span className="eyebrow">Weight (g)</span>
          <input
            type="number"
            min="1"
            value={draft.weight_g}
            onChange={(e) => field('weight_g', e.target.value)}
            className={`${inputClass} num`}
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(e) => field('is_active', e.target.checked)}
          />
          Visible to shoppers
        </label>
      </div>
      <label className="grid gap-1">
        <span className="eyebrow">Short description</span>
        <input
          value={draft.short_description}
          onChange={(e) => field('short_description', e.target.value)}
          placeholder="Shown on product cards and search results"
          className={inputClass}
        />
      </label>
      <label className="grid gap-1">
        <span className="eyebrow">Description</span>
        <textarea
          rows={3}
          value={draft.description}
          onChange={(e) => field('description', e.target.value)}
          className={inputClass}
        />
      </label>
      {error && <p className="text-sm text-kumkum">{error}</p>}
    </div>
  );
}
