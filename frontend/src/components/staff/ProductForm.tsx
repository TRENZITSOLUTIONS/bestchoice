'use client';

import { useEffect, useId, useState } from 'react';
import { useCategories, useBrands } from '@/hooks/useProducts';
import { useCreateBrand } from '@/hooks/useStaff';
import { rupees } from '@/lib/format';
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

/** The department a category belongs to (itself, if it already is one) - used
 * to decide which category-specific fields apply, e.g. in VariantManager. */
export function departmentSlugFor(categories: Category[], categoryId: number | null): string | null {
  if (categoryId == null) return null;
  for (const department of categories) {
    if (department.id === categoryId || department.children.some((c) => c.id === categoryId)) {
      return department.slug;
    }
  }
  return null;
}

/** A sentence-case field label, not the shared uppercase gold .eyebrow - that
 * treatment is for page-level meta text, not a form field staff reads dozens
 * of times a day. */
export const fieldLabelClass = 'text-xs font-semibold text-ink-soft';
export const fieldInputClass =
  'border border-line bg-ivory px-3 py-2 text-sm text-ink outline-none focus:border-marigold';

type Fields<K extends keyof ProductDraft> = {
  draft: Pick<ProductDraft, K>;
  onChange: (patch: Partial<ProductDraft>) => void;
};

export function ProductDetailsFields({ draft, onChange }: Fields<'name' | 'short_description' | 'description'>) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Name</span>
        <input
          required
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Cotton Casual Shirt"
          className={fieldInputClass}
        />
      </label>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Short description</span>
        <input
          value={draft.short_description}
          onChange={(e) => onChange({ short_description: e.target.value })}
          placeholder="Shown on product cards and search results"
          className={fieldInputClass}
        />
      </label>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Description</span>
        <textarea
          rows={4}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Shown on the full product page"
          className={fieldInputClass}
        />
      </label>
    </div>
  );
}

export function ProductPricingFields({ draft, onChange }: Fields<'mrp' | 'selling_price'>) {
  const mrp = Number(draft.mrp);
  const sellingPrice = Number(draft.selling_price);
  const discount = mrp > 0 && sellingPrice > 0 && sellingPrice <= mrp
    ? Math.round(((mrp - sellingPrice) / mrp) * 100)
    : null;

  return (
    <div className="grid gap-4">
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>MRP (₹)</span>
        <input
          required
          type="number"
          min="1"
          step="0.01"
          value={draft.mrp}
          onChange={(e) => onChange({ mrp: e.target.value })}
          className={`${fieldInputClass} num`}
        />
      </label>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Selling price (₹)</span>
        <input
          required
          type="number"
          min="1"
          step="0.01"
          value={draft.selling_price}
          onChange={(e) => onChange({ selling_price: e.target.value })}
          className={`${fieldInputClass} num`}
        />
      </label>
      {sellingPrice > 0 && (
        <>
          <div className="h-px bg-line" />
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-soft">Customer sees</span>
            <span className="num text-[0.95rem] font-bold">
              {rupees(sellingPrice)}
              {discount !== null && discount > 0 && (
                <span className="ml-2 text-xs font-bold text-leaf">{discount}% off</span>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function ProductOrganizationFields({ draft, onChange }: Fields<'category' | 'brand' | 'weight_g'>) {
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const createBrand = useCreateBrand();
  const categoryOptions = categories ? flattenCategories(categories) : [];
  const brandListId = useId();

  // Free-typed text, not the select's committed value - lets staff type a
  // brand that doesn't exist yet without every keystroke fighting the
  // dropdown. Resolved to an id (existing match, or a freshly-created brand)
  // on blur; see commitBrand below.
  const [brandText, setBrandText] = useState('');
  useEffect(() => {
    const current = brands?.find((b) => String(b.id) === draft.brand);
    setBrandText(current?.name ?? '');
  }, [draft.brand, brands]);

  function commitBrand() {
    const name = brandText.trim();
    if (!name) {
      onChange({ brand: '' });
      return;
    }
    const existing = brands?.find((b) => b.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      onChange({ brand: String(existing.id) });
      setBrandText(existing.name);
      return;
    }
    // No matching brand - create it on the fly. Staff shouldn't need to
    // leave this form and go to the separate Brands page just to add a
    // manufacturer that doesn't exist yet.
    createBrand.mutate(
      { name },
      { onSuccess: (created) => onChange({ brand: String(created.id) }) }
    );
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Category</span>
        <select
          required
          value={draft.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className={fieldInputClass}
        >
          <option value="" disabled>Choose one</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Brand (optional)</span>
        <input
          list={brandListId}
          value={brandText}
          onChange={(e) => setBrandText(e.target.value)}
          onBlur={commitBrand}
          placeholder="Type to search, or a new name to add one"
          className={fieldInputClass}
        />
        <datalist id={brandListId}>
          {brands?.map((b) => (
            <option key={b.id} value={b.name} />
          ))}
        </datalist>
        {createBrand.isPending && <span className="text-xs text-ink-soft">Adding brand…</span>}
      </label>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Weight (g)</span>
        <input
          type="number"
          min="1"
          value={draft.weight_g}
          onChange={(e) => onChange({ weight_g: e.target.value })}
          className={`${fieldInputClass} num`}
        />
      </label>
    </div>
  );
}

export function ProductStatusFields({
  draft,
  onChange,
  hasVariants,
}: Fields<'is_active' | 'total_stock'> & {
  /** Stock is derived from variants once a product has any - editing it here would be overwritten. */
  hasVariants?: boolean;
}) {
  return (
    <div className="grid gap-4">
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Visible to shoppers</span>
        <input
          type="checkbox"
          checked={draft.is_active}
          onChange={(e) => onChange({ is_active: e.target.checked })}
          className="h-4 w-4 accent-leaf"
        />
      </label>
      <div className="h-px bg-line" />
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>
          Stock{hasVariants ? ' (from variants)' : ''}
        </span>
        <input
          type="number"
          min="0"
          disabled={hasVariants}
          title={hasVariants ? 'This product has variants - edit their stock in the Variants section below.' : undefined}
          value={draft.total_stock}
          onChange={(e) => onChange({ total_stock: e.target.value })}
          className={`${fieldInputClass} num disabled:opacity-50`}
        />
      </label>
    </div>
  );
}
