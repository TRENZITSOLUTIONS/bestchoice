'use client';

import { useRef, useState } from 'react';
import {
  useStaffCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeactivateCategory,
  useUploadCategoryImage,
  useStaffBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeactivateBrand,
} from '@/hooks/useStaff';
import { EmptyState, ErrorState, Panel, StatusPill } from '@/components/staff/ui';
import { fieldLabelClass, fieldInputClass } from '@/components/staff/ProductForm';
import { mediaUrl } from '@/lib/format';
import type { CategoryRow, BrandRow } from '@/lib/staff-types';

function firstError(err: unknown): string | undefined {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return err ? 'Could not save that.' : undefined;
  const [field, msg] = Object.entries(data)[0] ?? [];
  if (!field) return 'Could not save that.';
  const text = Array.isArray(msg) ? msg.join(' ') : String(msg);
  return field === 'non_field_errors' ? text : `${field}: ${text}`;
}

interface CategoryDraft {
  name: string;
  parent: string;
  image: string;
  sort_order: string;
  is_active: boolean;
}

const EMPTY_CATEGORY: CategoryDraft = { name: '', parent: '', image: '', sort_order: '0', is_active: true };

function flattenTree(rows: CategoryRow[]): CategoryRow[] {
  return rows.flatMap((row) => [row, ...row.children]);
}

function CategoriesPanel() {
  const { data, isLoading, isError } = useStaffCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const deactivate = useDeactivateCategory();
  const uploadImage = useUploadCategoryImage();

  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<CategoryDraft>(EMPTY_CATEGORY);
  const saving = create.isPending || update.isPending;
  const error = create.isError ? firstError(create.error) : update.isError ? firstError(update.error) : undefined;

  const departments = data ?? [];
  const all = flattenTree(departments);

  function field<K extends keyof CategoryDraft>(key: K, value: CategoryDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function startCreate(parentId?: number) {
    setEditing('new');
    setDraft({ ...EMPTY_CATEGORY, parent: parentId ? String(parentId) : '' });
  }

  function startEdit(row: CategoryRow) {
    setEditing(row.id);
    setDraft({
      name: row.name,
      parent: row.parent ? String(row.parent) : '',
      image: row.image,
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    });
  }

  function cancel() {
    setEditing(null);
    create.reset();
    update.reset();
  }

  function save() {
    const payload = {
      name: draft.name,
      parent: draft.parent ? Number(draft.parent) : null,
      image: draft.image,
      sort_order: Number(draft.sort_order),
      is_active: draft.is_active,
    };
    if (editing === 'new') {
      create.mutate(payload, { onSuccess: () => setEditing(null) });
    } else if (editing !== null) {
      update.mutate({ id: editing, ...payload }, { onSuccess: () => setEditing(null) });
    }
  }

  return (
    <Panel
      title="Departments & categories"
      action={
        editing === null ? (
          <button
            onClick={() => startCreate()}
            className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-3.5 py-1.5"
          >
            + Add department
          </button>
        ) : undefined
      }
    >
      {editing !== null && (
        <div className="mb-6 grid gap-4 border-b border-line pb-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1.5">
              <span className={fieldLabelClass}>Name</span>
              <input
                required
                value={draft.name}
                onChange={(e) => field('name', e.target.value)}
                placeholder="Sarees"
                className={fieldInputClass}
              />
            </label>
            <label className="grid gap-1.5">
              <span className={fieldLabelClass}>Parent</span>
              <select
                value={draft.parent}
                onChange={(e) => field('parent', e.target.value)}
                className={fieldInputClass}
              >
                <option value="">None (top-level department)</option>
                {departments
                  .filter((d) => d.id !== editing)
                  .map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className={fieldLabelClass}>Sort order</span>
              <input
                type="number"
                value={draft.sort_order}
                onChange={(e) => field('sort_order', e.target.value)}
                className={`${fieldInputClass} num`}
              />
            </label>
            <label className="flex items-center justify-between gap-3 self-end pb-2">
              <span className="text-sm font-medium">Visible to shoppers</span>
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => field('is_active', e.target.checked)}
                className="h-4 w-4 accent-leaf"
              />
            </label>
          </div>
          {!draft.parent && (
            // Only departments (no parent) get a thumbnail - the home page
            // mosaic only ever fetches top-level categories, so a photo
            // uploaded for a subcategory like Shirts would never actually
            // be shown anywhere. Hidden here rather than left to silently
            // do nothing.
            <div className="grid gap-1.5">
              <span className={fieldLabelClass}>Department thumbnail photo (optional)</span>
              {typeof editing === 'number' ? (
                <CategoryPhotoUpload
                  image={draft.image}
                  uploading={uploadImage.isPending}
                  onUpload={(file) =>
                    uploadImage.mutate(
                      { id: editing, file },
                      { onSuccess: (updated) => field('image', updated.image) }
                    )
                  }
                />
              ) : (
                <p className="text-xs text-ink-faint">Save this department first, then you can upload a thumbnail photo for it.</p>
              )}
              <p className="text-xs text-ink-faint">
                Shown as the background photo on this department&apos;s tile on the home page.
              </p>
            </div>
          )}
          {error && <p className="text-sm text-kumkum">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-4 py-2 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={cancel} className="text-xs font-bold text-ink-soft hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-soft py-6">Loading…</p>
      ) : isError ? (
        <ErrorState />
      ) : !departments.length ? (
        <EmptyState message="No departments yet." />
      ) : (
        <div className="grid gap-1">
          {departments.map((dept) => (
            <div key={dept.id}>
              <CategoryRowView
                row={dept}
                onEdit={() => startEdit(dept)}
                onDeactivate={() => deactivate.mutate(dept.id)}
                onAddChild={() => startCreate(dept.id)}
              />
              {dept.children.map((child) => (
                <CategoryRowView
                  key={child.id}
                  row={child}
                  indent
                  onEdit={() => startEdit(child)}
                  onDeactivate={() => deactivate.mutate(child.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      {all.length > 0 && (
        <p className="text-xs text-ink-faint mt-4">
          Deactivating hides a category from the storefront and the product picker - it doesn&apos;t
          delete it or touch products already filed there.
        </p>
      )}
    </Panel>
  );
}

function CategoryPhotoUpload({
  image,
  uploading,
  onUpload,
}: {
  image: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(image)}
          alt=""
          className="h-16 w-24 border border-line object-cover"
        />
      ) : (
        <div className="h-16 w-24 border border-line bg-ivory-raised" />
      )}
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        className="text-xs font-bold text-marigold-lit disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : image ? 'Change thumbnail' : '+ Upload thumbnail'}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function CategoryRowView({
  row,
  indent,
  onEdit,
  onDeactivate,
  onAddChild,
}: {
  row: CategoryRow;
  indent?: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onAddChild?: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 py-2 border-t border-line text-sm ${indent ? 'pl-6' : ''}`}>
      <span className={indent ? 'text-ink-soft' : 'font-bold'}>{row.name}</span>
      {!row.is_active && <StatusPill value="cancelled" label="Inactive" />}
      <span className="text-xs text-ink-faint num">{row.product_count} products</span>
      <div className="ml-auto flex items-center gap-3 whitespace-nowrap">
        {onAddChild && (
          <button onClick={onAddChild} className="text-xs font-bold text-marigold-lit">
            + Subcategory
          </button>
        )}
        <button onClick={onEdit} className="text-xs font-bold underline">Edit</button>
        {row.is_active && (
          <button onClick={onDeactivate} className="text-xs text-kumkum underline">Deactivate</button>
        )}
      </div>
    </div>
  );
}

interface BrandDraft {
  name: string;
  logo: string;
  is_active: boolean;
}

const EMPTY_BRAND: BrandDraft = { name: '', logo: '', is_active: true };

function BrandsPanel() {
  const { data: brands, isLoading, isError } = useStaffBrands();
  const create = useCreateBrand();
  const update = useUpdateBrand();
  const deactivate = useDeactivateBrand();

  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<BrandDraft>(EMPTY_BRAND);
  const saving = create.isPending || update.isPending;
  const error = create.isError ? firstError(create.error) : update.isError ? firstError(update.error) : undefined;

  function field<K extends keyof BrandDraft>(key: K, value: BrandDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function startCreate() {
    setEditing('new');
    setDraft(EMPTY_BRAND);
  }

  function startEdit(row: BrandRow) {
    setEditing(row.id);
    setDraft({ name: row.name, logo: row.logo, is_active: row.is_active });
  }

  function cancel() {
    setEditing(null);
    create.reset();
    update.reset();
  }

  function save() {
    if (editing === 'new') {
      create.mutate({ ...draft }, { onSuccess: () => setEditing(null) });
    } else if (editing !== null) {
      update.mutate({ id: editing, ...draft }, { onSuccess: () => setEditing(null) });
    }
  }

  return (
    <Panel
      title="Brands"
      action={
        editing === null ? (
          <button
            onClick={startCreate}
            className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-3.5 py-1.5"
          >
            + Add brand
          </button>
        ) : undefined
      }
    >
      {editing !== null && (
        <div className="mb-6 grid gap-4 border-b border-line pb-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1.5">
              <span className={fieldLabelClass}>Name</span>
              <input
                required
                value={draft.name}
                onChange={(e) => field('name', e.target.value)}
                className={fieldInputClass}
              />
            </label>
            <label className="grid gap-1.5">
              <span className={fieldLabelClass}>Logo URL (optional)</span>
              <input
                value={draft.logo}
                onChange={(e) => field('logo', e.target.value)}
                placeholder="https://…"
                className={fieldInputClass}
              />
            </label>
            <label className="flex items-center justify-between gap-3 self-end pb-2">
              <span className="text-sm font-medium">Visible to shoppers</span>
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => field('is_active', e.target.checked)}
                className="h-4 w-4 accent-leaf"
              />
            </label>
          </div>
          {error && <p className="text-sm text-kumkum">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold px-4 py-2 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={cancel} className="text-xs font-bold text-ink-soft hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-soft py-6">Loading…</p>
      ) : isError ? (
        <ErrorState />
      ) : !brands?.length ? (
        <EmptyState message="No brands yet." />
      ) : (
        <div className="grid gap-1">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center gap-3 py-2 border-t border-line text-sm">
              <span className="font-bold">{brand.name}</span>
              {!brand.is_active && <StatusPill value="cancelled" label="Inactive" />}
              <div className="ml-auto flex items-center gap-3">
                <button onClick={() => startEdit(brand)} className="text-xs font-bold underline">Edit</button>
                {brand.is_active && (
                  <button onClick={() => deactivate.mutate(brand.id)} className="text-xs text-kumkum underline">
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default function StaffCategoriesPage() {
  return (
    <div className="grid gap-5">
      <CategoriesPanel />
      <BrandsPanel />
    </div>
  );
}
