'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCategories, useBrands } from '@/hooks/useProducts';
import { FABRIC_CHOICES, FIT_CHOICES, SLEEVE_TYPE_CHOICES, OCCASION_CHOICES, COLOR_SWATCHES, PRICE_RANGES } from '@/lib/constants';

const CLOTHING_CATEGORY_SLUGS = new Set(['mens-wear', 'womens-wear', 'kids-wear']);
const COSMETICS_SLUG = 'cosmetics';
const MOBILE_SLUG = 'mobile-accessories';

export function FilterSidebar({
  inferredCategorySlug,
  className = 'border-r border-line pr-7 text-sm',
}: {
  /** Best-guess department for the current search results, when the customer
   * hasn't explicitly picked a category - e.g. searching "kurta" should show
   * clothing filters without them having to click "Women's Wear" first. Only
   * used to decide which filter groups to show; it never checks a box. */
  inferredCategorySlug?: string;
  className?: string;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const activeCategory = searchParams.get('category');
  const scopeSlug = activeCategory ?? inferredCategorySlug;
  const topLevel = categories?.find((c) => c.slug === scopeSlug || c.children.some((ch) => ch.slug === scopeSlug));
  // Category-specific filters (fabric, skin type, etc.) only make sense once
  // a customer has actually narrowed down to that department - showing all
  // three departments' filters at once on the unfiltered "All categories"
  // view just buries the handful that apply under a wall of ones that don't.
  const showClothingFilters = !!topLevel && CLOTHING_CATEGORY_SLUGS.has(topLevel.slug);
  const showCosmeticsFilters = topLevel?.slug === COSMETICS_SLUG;
  const showMobileFilters = topLevel?.slug === MOBILE_SLUG;

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  function toggleParam(key: string, value: string) {
    setParam(key, searchParams.get(key) === value ? undefined : value);
  }

  return (
    <aside className={className}>
      <FilterGroup title="Category">
        {categories?.map((cat) => (
          <label key={cat.id} className="flex items-center gap-2 py-1 text-ink-soft">
            <input
              type="checkbox"
              checked={activeCategory === cat.slug}
              onChange={() => setParam('category', cat.slug)}
              className="accent-kumkum"
            />
            {cat.name} ({cat.product_count})
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Brand">
        {brands?.map((brand) => (
          <label key={brand.id} className="flex items-center gap-2 py-1 text-ink-soft">
            <input
              type="checkbox"
              checked={searchParams.get('brand') === brand.slug}
              onChange={() => toggleParam('brand', brand.slug)}
              className="accent-kumkum"
            />
            {brand.name}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        {PRICE_RANGES.map((range) => {
          const isActive = searchParams.get('price_gte') === (range.gte ?? '') && searchParams.get('price_lte') === (range.lte ?? '');
          return (
            <label key={range.label} className="flex items-center gap-2 py-1 text-ink-soft">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (isActive) {
                    params.delete('price_gte');
                    params.delete('price_lte');
                  } else {
                    if (range.gte) params.set('price_gte', range.gte); else params.delete('price_gte');
                    if (range.lte) params.set('price_lte', range.lte); else params.delete('price_lte');
                  }
                  params.delete('page');
                  router.push(`/products?${params.toString()}`);
                }}
                className="accent-kumkum"
              />
              {range.label}
            </label>
          );
        })}
      </FilterGroup>

      <FilterGroup title="Discount">
        {[10, 20, 30, 40].map((pct) => (
          <label key={pct} className="flex items-center gap-2 py-1 text-ink-soft">
            <input
              type="checkbox"
              checked={searchParams.get('discount') === String(pct)}
              onChange={() => toggleParam('discount', String(pct))}
              className="accent-kumkum"
            />
            {pct}% off or more
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Colour">
        <div className="flex gap-2 flex-wrap py-1">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={c.value}
              onClick={() => toggleParam('color', c.value)}
              className="w-5.5 h-5.5 rounded-full border-2"
              style={{
                background: c.hex,
                borderColor: searchParams.get('color') === c.value ? 'var(--kumkum)' : 'var(--card)',
                boxShadow: '0 0 0 1px var(--line)',
              }}
            />
          ))}
        </div>
      </FilterGroup>

      {showClothingFilters && (
        <>
          <FilterGroup title="Fabric">
            {FABRIC_CHOICES.map((f) => (
              <label key={f.value} className="flex items-center gap-2 py-1 text-ink-soft">
                <input type="checkbox" checked={searchParams.get('fabric') === f.value} onChange={() => toggleParam('fabric', f.value)} className="accent-kumkum" />
                {f.label}
              </label>
            ))}
          </FilterGroup>
          <FilterGroup title="Fit">
            {FIT_CHOICES.map((f) => (
              <label key={f.value} className="flex items-center gap-2 py-1 text-ink-soft">
                <input type="checkbox" checked={searchParams.get('fit') === f.value} onChange={() => toggleParam('fit', f.value)} className="accent-kumkum" />
                {f.label}
              </label>
            ))}
          </FilterGroup>
          <FilterGroup title="Sleeve Type">
            {SLEEVE_TYPE_CHOICES.map((f) => (
              <label key={f.value} className="flex items-center gap-2 py-1 text-ink-soft">
                <input type="checkbox" checked={searchParams.get('sleeve_type') === f.value} onChange={() => toggleParam('sleeve_type', f.value)} className="accent-kumkum" />
                {f.label}
              </label>
            ))}
          </FilterGroup>
          <FilterGroup title="Occasion">
            {OCCASION_CHOICES.map((f) => (
              <label key={f.value} className="flex items-center gap-2 py-1 text-ink-soft">
                <input type="checkbox" checked={searchParams.get('occasion') === f.value} onChange={() => toggleParam('occasion', f.value)} className="accent-kumkum" />
                {f.label}
              </label>
            ))}
          </FilterGroup>
        </>
      )}

      {showCosmeticsFilters && (
        <FilterGroup title="Skin Type">
          {['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive', 'All'].map((s) => (
            <label key={s} className="flex items-center gap-2 py-1 text-ink-soft">
              <input type="checkbox" checked={searchParams.get('skin_type') === s} onChange={() => toggleParam('skin_type', s)} className="accent-kumkum" />
              {s}
            </label>
          ))}
        </FilterGroup>
      )}

      {showMobileFilters && (
        <FilterGroup title="Compatible Device">
          <input
            type="text"
            placeholder="e.g. iPhone 14"
            defaultValue={searchParams.get('compatible_device') ?? ''}
            onBlur={(e) => setParam('compatible_device', e.target.value || undefined)}
            className="w-full border border-line rounded px-2.5 py-1.5 bg-card text-sm mt-1"
          />
        </FilterGroup>
      )}

      <FilterGroup title="Availability" last>
        <label className="flex items-center gap-2 py-1 text-ink-soft">
          <input
            type="checkbox"
            checked={searchParams.get('availability') === 'in_stock'}
            onChange={() => toggleParam('availability', 'in_stock')}
            className="accent-kumkum"
          />
          In stock only
        </label>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children, last = false }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`py-4.5 ${last ? '' : 'border-b border-line'} first:pt-0`}>
      <h4 className="text-xs tracking-wide uppercase mb-3">{title}</h4>
      {children}
    </div>
  );
}
