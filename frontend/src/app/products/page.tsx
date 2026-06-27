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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {category ? category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'All Products'}
      </h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="number"
          placeholder="Min price"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm w-28"
        />
        <input
          type="number"
          placeholder="Max price"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm w-28"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">Sort by</option>
          <option value="selling_price">Price: Low to High</option>
          <option value="-selling_price">Price: High to Low</option>
          <option value="-created_at">Newest First</option>
          <option value="name">Name A-Z</option>
        </select>
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
                  <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
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
