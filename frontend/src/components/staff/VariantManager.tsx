'use client';

import { useState } from 'react';
import {
  useProductVariants,
  useCreateProductVariant,
  useUpdateProductVariant,
  useDeleteProductVariant,
} from '@/hooks/useStaff';
import { useCategories } from '@/hooks/useProducts';
import { money } from '@/components/staff/ui';
import { CLOTHING_DEPARTMENT_SLUGS, departmentSlugFor } from '@/components/staff/ProductForm';
import type { VariantRow } from '@/lib/staff-types';

const FABRIC_OPTIONS = ['cotton', 'linen', 'viscose', 'denim', 'polyester', 'rayon', 'blend', 'others'];
const FIT_OPTIONS = ['regular', 'slim', 'oversized', 'relaxed'];
const SLEEVE_OPTIONS = ['half_sleeve', 'full_sleeve'];
const OCCASION_OPTIONS = ['casual', 'formal', 'party', 'ethnic'];

/** Which variant axes actually apply to each department - the model has every
 * axis on one row (see backend/products/models.py), but showing all of them
 * on every product regardless of category is just noise: a lipstick doesn't
 * have a Fit, a shirt doesn't have a Shade. Falls back to "show everything"
 * when the department isn't recognised (e.g. category not chosen yet), so
 * nothing is ever hidden by mistake. */
function fieldsForDepartment(departmentSlug: string | null) {
  if (departmentSlug === 'cosmetics') {
    return { color: false, size: false, shade: true, volume: true, fabric: false, fit: false, ageGroup: false, sleeve: false, occasion: false, skinType: true };
  }
  if (departmentSlug === 'mobile-accessories') {
    return { color: true, size: false, shade: false, volume: false, fabric: false, fit: false, ageGroup: false, sleeve: false, occasion: false, skinType: false };
  }
  if (departmentSlug && CLOTHING_DEPARTMENT_SLUGS.has(departmentSlug)) {
    return {
      color: true, size: true, shade: false, volume: false,
      fabric: true, fit: true, sleeve: true, occasion: true,
      ageGroup: departmentSlug === 'kids-wear', skinType: false,
    };
  }
  // Unrecognised/no category yet - show every axis rather than guess wrong.
  return { color: true, size: true, shade: true, volume: true, fabric: true, fit: true, ageGroup: true, sleeve: true, occasion: true, skinType: true };
}

interface VariantDraft {
  color: string;
  size: string;
  shade: string;
  volume: string;
  fabric: string;
  fit: string;
  age_group: string;
  sleeve_type: string;
  occasion: string;
  skin_type: string;
  stock: string;
  price_override: string;
  is_active: boolean;
}

const EMPTY_VARIANT: VariantDraft = {
  color: '', size: '', shade: '', volume: '',
  fabric: '', fit: '', age_group: '', sleeve_type: '', occasion: '',
  skin_type: '', stock: '0', price_override: '', is_active: true,
};

function draftFromVariant(v: VariantRow): VariantDraft {
  return {
    color: v.color, size: v.size, shade: v.shade, volume: v.volume,
    fabric: v.fabric, fit: v.fit, age_group: v.age_group,
    sleeve_type: v.sleeve_type, occasion: v.occasion, skin_type: v.skin_type,
    stock: String(v.stock), price_override: v.price_override ?? '', is_active: v.is_active,
  };
}

function toPayload(d: VariantDraft) {
  return {
    color: d.color, size: d.size, shade: d.shade, volume: d.volume,
    fabric: d.fabric, fit: d.fit, age_group: d.age_group,
    sleeve_type: d.sleeve_type, occasion: d.occasion, skin_type: d.skin_type,
    stock: Number(d.stock), price_override: d.price_override || null, is_active: d.is_active,
  };
}

/** The one non-field error the backend raises (a duplicate variant) has no
 * field name to key off, so it needs its own branch rather than "field: msg". */
function firstError(err: unknown): string | undefined {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return err ? 'Could not save that variant.' : undefined;
  const [field, msg] = Object.entries(data)[0] ?? [];
  if (!field) return 'Could not save that variant.';
  const text = Array.isArray(msg) ? msg.join(' ') : String(msg);
  return field === 'non_field_errors' ? text : `${field}: ${text}`;
}

const inputClass = 'border border-line bg-ivory px-2 py-1.5 text-sm outline-none focus:border-marigold';

export function VariantManager({ productId, categoryId }: { productId: number; categoryId: number | null }) {
  const { data: variants, isLoading } = useProductVariants(productId);
  const { data: categories } = useCategories();
  const create = useCreateProductVariant(productId);
  const update = useUpdateProductVariant(productId);
  const remove = useDeleteProductVariant(productId);

  const department = categories ? departmentSlugFor(categories, categoryId) : null;
  const fields = fieldsForDepartment(department);

  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<VariantDraft>(EMPTY_VARIANT);
  const saving = create.isPending || update.isPending;
  const error = create.isError ? firstError(create.error) : update.isError ? firstError(update.error) : undefined;

  function field<K extends keyof VariantDraft>(key: K, value: VariantDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function startCreate() {
    setEditing('new');
    setDraft(EMPTY_VARIANT);
  }

  function startEdit(v: VariantRow) {
    setEditing(v.id);
    setDraft(draftFromVariant(v));
  }

  function save() {
    const payload = toPayload(draft);
    if (editing === 'new') {
      create.mutate(payload, { onSuccess: () => setEditing(null) });
    } else if (editing !== null) {
      update.mutate({ id: editing, ...payload }, { onSuccess: () => setEditing(null) });
    }
  }

  return (
    <div className="grid gap-3">
      {editing === null && (
        <div className="flex items-center justify-end">
          <button onClick={startCreate} className="text-xs font-bold text-marigold-lit">
            + Add variant
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : !variants?.length && editing === null ? (
        <p className="text-sm text-ink-soft">No variants - stock and price are set directly on the product.</p>
      ) : (
        !!variants?.length && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-ink-soft">
                  <th className="pb-1.5 font-medium">SKU</th>
                  <th className="pb-1.5 font-medium">Options</th>
                  <th className="pb-1.5 pr-4 text-right font-medium">Stock</th>
                  <th className="pb-1.5 text-right font-medium">Price override</th>
                  <th className="pb-1.5" />
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-t border-line">
                    <td className="num py-2 text-xs">
                      {v.sku}
                      <span className="block text-ink-soft">{v.variant_id}</span>
                    </td>
                    <td className="py-2 text-ink-soft">
                      {[v.color, v.size, v.shade, v.volume].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="num py-2 pr-4 text-right">{v.stock}</td>
                    <td className="num py-2 text-right">
                      {v.price_override ? money(v.price_override) : '—'}
                    </td>
                    <td className="whitespace-nowrap py-2 text-right">
                      <button onClick={() => startEdit(v)} className="text-xs font-bold underline">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete variant ${v.sku}?`)) remove.mutate(v.id);
                        }}
                        className="ml-3 text-xs text-kumkum underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {editing !== null && (
        <div className="grid gap-2.5 border border-line p-3">
          <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {fields.color && (
              <label className="grid gap-1">
                <span className="eyebrow">Colour</span>
                <input value={draft.color} onChange={(e) => field('color', e.target.value)} className={inputClass} />
              </label>
            )}
            {fields.size && (
              <label className="grid gap-1">
                <span className="eyebrow">Size</span>
                <input
                  value={draft.size}
                  onChange={(e) => field('size', e.target.value)}
                  placeholder="S / M / L / 32"
                  className={inputClass}
                />
              </label>
            )}
            {fields.shade && (
              <label className="grid gap-1">
                <span className="eyebrow">Shade</span>
                <input
                  value={draft.shade}
                  onChange={(e) => field('shade', e.target.value)}
                  placeholder="Cosmetics"
                  className={inputClass}
                />
              </label>
            )}
            {fields.volume && (
              <label className="grid gap-1">
                <span className="eyebrow">Volume</span>
                <input
                  value={draft.volume}
                  onChange={(e) => field('volume', e.target.value)}
                  placeholder="30ml"
                  className={inputClass}
                />
              </label>
            )}
            {fields.fabric && (
              <label className="grid gap-1">
                <span className="eyebrow">Fabric</span>
                <select value={draft.fabric} onChange={(e) => field('fabric', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {FABRIC_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </label>
            )}
            {fields.fit && (
              <label className="grid gap-1">
                <span className="eyebrow">Fit</span>
                <select value={draft.fit} onChange={(e) => field('fit', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {FIT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </label>
            )}
            {fields.sleeve && (
              <label className="grid gap-1">
                <span className="eyebrow">Sleeve</span>
                <select value={draft.sleeve_type} onChange={(e) => field('sleeve_type', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {SLEEVE_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f.replace('_', ' ')}</option>
                  ))}
                </select>
              </label>
            )}
            {fields.occasion && (
              <label className="grid gap-1">
                <span className="eyebrow">Occasion</span>
                <select value={draft.occasion} onChange={(e) => field('occasion', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {OCCASION_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </label>
            )}
            {fields.ageGroup && (
              <label className="grid gap-1">
                <span className="eyebrow">Age group</span>
                <input
                  value={draft.age_group}
                  onChange={(e) => field('age_group', e.target.value)}
                  placeholder="Kids only, e.g. 2-4Y"
                  className={inputClass}
                />
              </label>
            )}
            {fields.skinType && (
              <label className="grid gap-1">
                <span className="eyebrow">Skin type</span>
                <input
                  value={draft.skin_type}
                  onChange={(e) => field('skin_type', e.target.value)}
                  placeholder="Oily / Dry / All"
                  className={inputClass}
                />
              </label>
            )}
            <label className="grid gap-1">
              <span className="eyebrow">Stock</span>
              <input
                type="number"
                min="0"
                value={draft.stock}
                onChange={(e) => field('stock', e.target.value)}
                className={`${inputClass} num`}
              />
            </label>
            <label className="grid gap-1">
              <span className="eyebrow">Price override (₹, optional)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.price_override}
                onChange={(e) => field('price_override', e.target.value)}
                placeholder="Uses product price"
                className={`${inputClass} num`}
              />
            </label>
          </div>
          {error && <p className="text-xs text-kumkum">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-3.5 py-1.5 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save variant'}
            </button>
            <button onClick={() => setEditing(null)} className="text-xs text-ink-soft hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
