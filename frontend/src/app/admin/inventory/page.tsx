'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AdminInventoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/products/?page_size=100').then((r) => r.data),
  });

  const outOfStock = data?.results?.filter((p: any) => !p.in_stock) || [];
  const inStock = data?.results?.filter((p: any) => p.in_stock) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">In Stock</p>
          <p className="text-2xl font-bold text-green-600">{inStock.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStock.length}</p>
        </div>
      </div>

      {outOfStock.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-3 text-red-600">⚠ Out of Stock Products</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {outOfStock.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.auto_product_id}</td>
                    <td className="px-4 py-3"><span className="text-red-600 text-xs">Out of Stock</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isLoading && <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />}
    </div>
  );
}
