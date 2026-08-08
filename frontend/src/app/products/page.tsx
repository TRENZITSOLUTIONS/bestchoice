'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCategories, useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/products/FilterSidebar';
import { MobileFilters } from '@/components/products/MobileFilters';

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = {
    category: searchParams.get('category') ?? undefined,
    brand: searchParams.get('brand') ?? undefined,
    selling_price_gte: searchParams.get('price_gte') ?? undefined,
    selling_price_lte: searchParams.get('price_lte') ?? undefined,
    color: searchParams.get('color') ?? undefined,
    size: searchParams.get('size') ?? undefined,
    discount: searchParams.get('discount') ?? undefined,
    fabric: searchParams.get('fabric') ?? undefined,
    fit: searchParams.get('fit') ?? undefined,
    sleeve_type: searchParams.get('sleeve_type') ?? undefined,
    occasion: searchParams.get('occasion') ?? undefined,
    shade: searchParams.get('shade') ?? undefined,
    skin_type: searchParams.get('skin_type') ?? undefined,
    compatible_device: searchParams.get('compatible_device') ?? undefined,
    availability: (searchParams.get('availability') as 'in_stock' | 'out_of_stock' | undefined) ?? undefined,
    search: searchParams.get('search') ?? undefined,
    ordering: searchParams.get('ordering') ?? undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
  };

  const { data, isLoading } = useProducts(filters);
  const { data: categories } = useCategories();

  // When a customer searches instead of picking a category, guess which
  // department their results mostly belong to, from the current page of
  // results, so the filter groups can still be scoped sensibly (fabric/fit
  // for a clothing search, skin type for a cosmetics one) instead of either
  // showing every department's filters or none at all.
  const inferredCategorySlug = useMemo(() => {
    if (filters.category || !filters.search || !data?.results.length) return undefined;
    const counts = new Map<string, number>();
    for (const p of data.results) {
      if (p.category_slug) counts.set(p.category_slug, (counts.get(p.category_slug) ?? 0) + 1);
    }
    let best: string | undefined;
    let bestCount = 0;
    for (const [slug, count] of counts) {
      if (count > bestCount) {
        best = slug;
        bestCount = count;
      }
    }
    return best;
  }, [filters.category, filters.search, data]);

  function setOrdering(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('ordering', value);
    else params.delete('ordering');
    router.push(`/products?${params.toString()}`);
  }

  // Use the real category name from the API - title-casing the slug can't
  // recover punctuation, so "womens-wear" came out as "Womens Wear".
  const categoryLabel = filters.category
    ? (categories
        ?.flatMap((c) => [c, ...c.children])
        .find((c) => c.slug === filters.category)?.name ?? filters.category)
    : undefined;

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7">
      <p className="text-sm text-ink-soft pt-5">
        Home {categoryLabel && <> / <span className="text-ink font-semibold">{categoryLabel}</span></>}
      </p>

      <div className="grid sm:grid-cols-[240px_1fr] gap-9 py-5 pb-16">
        {/* hidden below sm: a full filter sidebar rendered inline used to sit
            above the product grid on mobile, so a phone visitor scrolled past
            a dozen filter groups before seeing a single product. MobileFilters
            below gives phones the same filters in an on-demand sheet instead. */}
        <div className="hidden sm:block">
          <FilterSidebar inferredCategorySlug={inferredCategorySlug} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-5.5 text-sm gap-3">
            <span>
              <b>{data?.count ?? 0}</b> products
            </span>
            <MobileFilters inferredCategorySlug={inferredCategorySlug} />
            <select
              value={filters.ordering ?? ''}
              onChange={(e) => setOrdering(e.target.value)}
              className="border border-line rounded px-3 py-2 bg-card text-sm"
            >
              <option value="">Sort: Newest</option>
              <option value="selling_price">Price: Low to High</option>
              <option value="-selling_price">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>

          {isLoading && <p className="text-sm text-ink-soft">Loading products...</p>}
          {!isLoading && data?.results.length === 0 && (
            <p className="text-sm text-ink-soft">No products match these filters.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5.5">
            {data?.results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {data && data.count > 20 && (
            <div className="flex justify-center gap-2 mt-9">
              {Array.from({ length: Math.ceil(data.count / 20) }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = (filters.page ?? 1) === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('page', String(pageNum));
                      router.push(`/products?${params.toString()}`);
                    }}
                    className={`w-8 h-8 rounded text-sm ${isActive ? 'bg-kumkum text-white' : 'border border-line'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-ink-soft">Loading...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
