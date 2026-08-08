'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCategories, useBrands } from '@/hooks/useProducts';
import {
  FABRIC_CHOICES, FIT_CHOICES, SLEEVE_TYPE_CHOICES, OCCASION_CHOICES,
  COLOR_SWATCHES, PRICE_RANGES,
} from '@/lib/constants';

const CLOTHING_CATEGORY_SLUGS = new Set(['mens-wear', 'womens-wear', 'kids-wear']);
const COSMETICS_SLUG = 'cosmetics';
const MOBILE_SLUG = 'mobile-accessories';
const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive', 'All'];
const DISCOUNTS = [10, 20, 30, 40];

const ALL_PARAMS = [
  'category', 'brand', 'price_gte', 'price_lte', 'discount', 'color',
  'fabric', 'fit', 'sleeve_type', 'occasion', 'skin_type', 'compatible_device',
  'availability',
];

/**
 * Every filter is a single choice per group in this app (one category, one
 * price band, one brand at a time - all driven by single URL params), which
 * is exactly what a chip-and-popover pattern wants: tap a chip, pick one
 * thing, it applies immediately and the panel closes. This is the mobile
 * shopping pattern most Indian customers already know from Myntra/Ajio/
 * Nykaa, and it keeps the product grid on screen the whole time instead of
 * covering it with a sheet.
 */
export function FilterChips({ inferredCategorySlug }: { inferredCategorySlug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const activeCategory = searchParams.get('category');
  const scopeSlug = activeCategory ?? inferredCategorySlug;
  const topLevel = categories?.find((c) => c.slug === scopeSlug || c.children.some((ch) => ch.slug === scopeSlug));
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

  function choose(key: string, value: string) {
    setParam(key, searchParams.get(key) === value ? undefined : value);
    setOpenGroup(null);
  }

  function toggle(key: string) {
    setOpenGroup((g) => (g === key ? null : key));
  }

  const activeCount = ALL_PARAMS.filter((key) => searchParams.get(key)).length;
  const priceActive = PRICE_RANGES.find(
    (r) => searchParams.get('price_gte') === (r.gte ?? '') && searchParams.get('price_lte') === (r.lte ?? '')
  );
  const categoryActive = categories?.find((c) => c.slug === activeCategory);
  const brandActive = brands?.find((b) => b.slug === searchParams.get('brand'));

  return (
    <div className="sm:hidden">
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip label="Category" value={categoryActive?.name} open={openGroup === 'category'} onClick={() => toggle('category')} />
        <Chip label="Brand" value={brandActive?.name} open={openGroup === 'brand'} onClick={() => toggle('brand')} />
        <Chip label="Price" value={priceActive?.label} open={openGroup === 'price'} onClick={() => toggle('price')} />
        <Chip label="Discount" value={searchParams.get('discount') ? `${searchParams.get('discount')}%+` : undefined} open={openGroup === 'discount'} onClick={() => toggle('discount')} />
        <Chip label="Colour" value={searchParams.get('color') ?? undefined} open={openGroup === 'color'} onClick={() => toggle('color')} />
        {showClothingFilters && (
          <>
            <Chip label="Fabric" value={FABRIC_CHOICES.find((f) => f.value === searchParams.get('fabric'))?.label} open={openGroup === 'fabric'} onClick={() => toggle('fabric')} />
            <Chip label="Fit" value={FIT_CHOICES.find((f) => f.value === searchParams.get('fit'))?.label} open={openGroup === 'fit'} onClick={() => toggle('fit')} />
            <Chip label="Sleeve" value={SLEEVE_TYPE_CHOICES.find((f) => f.value === searchParams.get('sleeve_type'))?.label} open={openGroup === 'sleeve_type'} onClick={() => toggle('sleeve_type')} />
            <Chip label="Occasion" value={OCCASION_CHOICES.find((f) => f.value === searchParams.get('occasion'))?.label} open={openGroup === 'occasion'} onClick={() => toggle('occasion')} />
          </>
        )}
        {showCosmeticsFilters && (
          <Chip label="Skin Type" value={searchParams.get('skin_type') ?? undefined} open={openGroup === 'skin_type'} onClick={() => toggle('skin_type')} />
        )}
        {showMobileFilters && (
          <Chip label="Device" value={searchParams.get('compatible_device') ?? undefined} open={openGroup === 'compatible_device'} onClick={() => toggle('compatible_device')} />
        )}
        <button
          type="button"
          onClick={() => choose('availability', 'in_stock')}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            searchParams.get('availability') === 'in_stock'
              ? 'border-kumkum bg-kumkum text-white'
              : 'border-line text-ink-soft'
          }`}
        >
          In stock only
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              ALL_PARAMS.forEach((key) => params.delete(key));
              params.delete('page');
              router.push(`/products?${params.toString()}`);
              setOpenGroup(null);
            }}
            className="shrink-0 px-2 py-1.5 text-xs font-bold text-kumkum-deep whitespace-nowrap"
          >
            Clear all
          </button>
        )}
      </div>

      {openGroup && (
        <div className="mt-2 border border-line bg-card p-4">
          {openGroup === 'category' && (
            <OptionGrid>
              {categories?.map((cat) => (
                <Option key={cat.id} active={activeCategory === cat.slug} onClick={() => choose('category', cat.slug)}>
                  {cat.name} ({cat.product_count})
                </Option>
              ))}
            </OptionGrid>
          )}
          {openGroup === 'brand' && (
            <OptionGrid>
              {brands?.map((brand) => (
                <Option key={brand.id} active={searchParams.get('brand') === brand.slug} onClick={() => choose('brand', brand.slug)}>
                  {brand.name}
                </Option>
              ))}
            </OptionGrid>
          )}
          {openGroup === 'price' && (
            <OptionGrid>
              {PRICE_RANGES.map((range) => {
                const isActive = searchParams.get('price_gte') === (range.gte ?? '') && searchParams.get('price_lte') === (range.lte ?? '');
                return (
                  <Option
                    key={range.label}
                    active={isActive}
                    onClick={() => {
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
                      setOpenGroup(null);
                    }}
                  >
                    {range.label}
                  </Option>
                );
              })}
            </OptionGrid>
          )}
          {openGroup === 'discount' && (
            <OptionGrid>
              {DISCOUNTS.map((pct) => (
                <Option key={pct} active={searchParams.get('discount') === String(pct)} onClick={() => choose('discount', String(pct))}>
                  {pct}% off or more
                </Option>
              ))}
            </OptionGrid>
          )}
          {openGroup === 'color' && (
            <div className="flex flex-wrap gap-3">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-label={c.value}
                  onClick={() => choose('color', c.value)}
                  className="h-8 w-8 rounded-full border-2"
                  style={{
                    background: c.hex,
                    borderColor: searchParams.get('color') === c.value ? 'var(--kumkum)' : 'var(--card)',
                    boxShadow: '0 0 0 1px var(--line)',
                  }}
                />
              ))}
            </div>
          )}
          {openGroup === 'fabric' && (
            <OptionGrid>
              {FABRIC_CHOICES.map((f) => (
                <Option key={f.value} active={searchParams.get('fabric') === f.value} onClick={() => choose('fabric', f.value)}>
                  {f.label}
                </Option>
              ))}
            </OptionGrid>
          )}
          {openGroup === 'fit' && (
            <OptionGrid>
              {FIT_CHOICES.map((f) => (
                <Option key={f.value} active={searchParams.get('fit') === f.value} onClick={() => choose('fit', f.value)}>
                  {f.label}
                </Option>
              ))}
            </OptionGrid>
          )}
          {openGroup === 'sleeve_type' && (
            <OptionGrid>
              {SLEEVE_TYPE_CHOICES.map((f) => (
                <Option key={f.value} active={searchParams.get('sleeve_type') === f.value} onClick={() => choose('sleeve_type', f.value)}>
                  {f.label}
                </Option>
              ))}
            </OptionGrid>
          )}
          {openGroup === 'occasion' && (
            <OptionGrid>
              {OCCASION_CHOICES.map((f) => (
                <Option key={f.value} active={searchParams.get('occasion') === f.value} onClick={() => choose('occasion', f.value)}>
                  {f.label}
                </Option>
              ))}
            </OptionGrid>
          )}
          {openGroup === 'skin_type' && (
            <OptionGrid>
              {SKIN_TYPES.map((s) => (
                <Option key={s} active={searchParams.get('skin_type') === s} onClick={() => choose('skin_type', s)}>
                  {s}
                </Option>
              ))}
            </OptionGrid>
          )}
          {openGroup === 'compatible_device' && (
            <input
              type="text"
              autoFocus
              placeholder="e.g. iPhone 14"
              defaultValue={searchParams.get('compatible_device') ?? ''}
              onBlur={(e) => {
                setParam('compatible_device', e.target.value || undefined);
                setOpenGroup(null);
              }}
              className="w-full border border-line rounded px-3 py-2 bg-card text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ label, value, open, onClick }: { label: string; value?: string; open: boolean; onClick: () => void }) {
  const active = !!value;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
        active ? 'border-kumkum bg-kumkum text-white' : open ? 'border-ink text-ink' : 'border-line text-ink-soft'
      }`}
    >
      {active ? value : label}
      <span aria-hidden className={`text-[0.6rem] transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
    </button>
  );
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-1 max-h-[40vh] overflow-y-auto">{children}</div>;
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left px-3 py-2.5 rounded text-sm ${active ? 'bg-kumkum text-white font-semibold' : 'text-ink-soft hover:bg-ivory-raised'}`}
    >
      {children}
    </button>
  );
}
