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
  // Cosmetics-specific
  expiry_date: string;
  batch_number: string;
  ingredients: string;
  usage_instructions: string;
  // Clothing-specific (Men's / Women's / Kids' Wear)
  care_instructions: string;
  // Mobile Accessories-specific
  compatible_devices: string;
  warranty: string;
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
  expiry_date: '',
  batch_number: '',
  ingredients: '',
  usage_instructions: '',
  care_instructions: '',
  compatible_devices: '',
  warranty: '',
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
    expiry_date: row.expiry_date ?? '',
    batch_number: row.batch_number,
    ingredients: row.ingredients,
    usage_instructions: row.usage_instructions,
    care_instructions: row.care_instructions,
    compatible_devices: row.compatible_devices,
    warranty: row.warranty,
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
    // Sent regardless of the product's own category - harmless for a
    // department where they don't apply (they're just blank), and simpler
    // than trying to strip them client-side.
    expiry_date: draft.expiry_date || null,
    batch_number: draft.batch_number,
    ingredients: draft.ingredients,
    usage_instructions: draft.usage_instructions,
    care_instructions: draft.care_instructions,
    compatible_devices: draft.compatible_devices,
    warranty: draft.warranty,
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

/** Departments where "size" is a real, expected choice a shopper has to
 * make - shared between VariantManager (which fields to show) and the
 * inventory page (the no-variants warning below). */
export const CLOTHING_DEPARTMENT_SLUGS = new Set(['mens-wear', 'womens-wear', 'kids-wear']);

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

export function ProductCosmeticsFields({
  draft,
  onChange,
}: Fields<'expiry_date' | 'batch_number' | 'ingredients' | 'usage_instructions'>) {
  return (
    <div className="grid gap-4">
      <p className="text-xs text-ink-soft -mt-1">
        Only shown for Cosmetics products - it won&apos;t appear on the form for Clothing or
        Mobile Accessories, since none of this applies to them.
      </p>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Expiry date</span>
        <input
          type="date"
          value={draft.expiry_date}
          onChange={(e) => onChange({ expiry_date: e.target.value })}
          className={fieldInputClass}
        />
      </label>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Batch number</span>
        <input
          value={draft.batch_number}
          onChange={(e) => onChange({ batch_number: e.target.value })}
          className={fieldInputClass}
        />
      </label>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Ingredients</span>
        <textarea
          rows={3}
          value={draft.ingredients}
          onChange={(e) => onChange({ ingredients: e.target.value })}
          className={fieldInputClass}
        />
      </label>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Usage instructions</span>
        <textarea
          rows={3}
          value={draft.usage_instructions}
          onChange={(e) => onChange({ usage_instructions: e.target.value })}
          className={fieldInputClass}
        />
      </label>
    </div>
  );
}

export function ProductClothingFields({ draft, onChange }: Fields<'care_instructions'>) {
  return (
    <div className="grid gap-2">
      <p className="text-xs text-ink-soft">
        Only shown for Men&apos;s/Women&apos;s/Kids&apos; Wear products - Cosmetics and Mobile
        Accessories don&apos;t get this field.
      </p>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Care instructions</span>
        <textarea
          rows={3}
          value={draft.care_instructions}
          onChange={(e) => onChange({ care_instructions: e.target.value })}
          placeholder="e.g. Machine wash cold, do not bleach, tumble dry low"
          className={fieldInputClass}
        />
      </label>
    </div>
  );
}

export function ProductMobileAccessoryFields({
  draft,
  onChange,
}: Fields<'compatible_devices' | 'warranty'>) {
  return (
    <div className="grid gap-4">
      <p className="text-xs text-ink-soft -mt-1">
        Only shown for Mobile Accessories products - Clothing and Cosmetics don&apos;t get these.
      </p>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Compatible devices</span>
        <textarea
          rows={2}
          value={draft.compatible_devices}
          onChange={(e) => onChange({ compatible_devices: e.target.value })}
          placeholder="Comma-separated, e.g. iPhone 15, iPhone 14, iPhone 13"
          className={fieldInputClass}
        />
      </label>
      <label className="grid gap-1.5">
        <span className={fieldLabelClass}>Warranty (optional)</span>
        <input
          value={draft.warranty}
          onChange={(e) => onChange({ warranty: e.target.value })}
          placeholder='e.g. "6 months"'
          className={fieldInputClass}
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
