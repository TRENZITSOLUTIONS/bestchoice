'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ProductGrid() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('search', search);
  if (priceMin) params.set('selling_price__gte', priceMin);
  if (priceMax) params.set('selling_price__lte', priceMax);
  if (sort) params.set('ordering', sort);

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, search, priceMin, priceMax, sort],
    queryFn: () => api.get(`/products/?${params.toString()}`).then((r) => r.data),
  });

  const filterContent = (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Price Range</p>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm w-full" />
          <input type="number" placeholder="Max" value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm w-full" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Sort By</p>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm w-full">
          <option value="">Default</option>
          <option value="selling_price">Price: Low to High</option>
          <option value="-selling_price">Price: High to Low</option>
          <option value="-created_at">Newest First</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>
      {(priceMin || priceMax || sort) && (
        <button onClick={() => { setPriceMin(''); setPriceMax(''); setSort(''); }}
          className="text-red-500 text-sm hover:underline">Clear Filters</button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {category ? category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'All Products'}
        </h1>
        <button onClick={() => setDrawerOpen(!drawerOpen)}
          className="md:hidden bg-gray-100 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200">
          Filters {(priceMin || priceMax || sort) ? '●' : ''}
        </button>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Filters</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-xl">✕</button>
            </div>
            {filterContent}
          </div>
        </div>
      )}

      {/* Desktop filters */}
      <div className="hidden md:flex gap-4 mb-6 items-start">
        {filterContent}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.results?.map((product: any) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group bg-white rounded-lg shadow-sm hover:shadow-md transition p-3"
            >
              <div className="bg-gray-100 rounded-lg h-48 mb-3 flex items-center justify-center text-gray-400">
                {product.primary_image ? (
                  <img loading="lazy" src={product.primary_image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-4xl">📷</span>
                )}
              </div>
              <h3 className="font-medium text-sm group-hover:text-blue-600 line-clamp-2">{product.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{product.category}</p>
              <div className="mt-2">
                <span className="text-blue-600 font-bold">₹{product.selling_price}</span>
                {product.mrp > product.selling_price && (
                  <>
                    <span className="text-gray-400 line-through text-xs ml-2">₹{product.mrp}</span>
                    <span className="text-green-600 text-xs ml-1">{product.discount_percent}% off</span>
                  </>
                )}
              </div>
              {product.in_stock ? (
                <span className="text-xs text-green-600">In Stock</span>
              ) : (
                <span className="text-xs text-red-500">Out of Stock</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {data?.results?.length === 0 && (
        <p className="text-gray-500 text-center py-12">No products found.</p>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ProductGrid />
    </Suspense>
  );
}
