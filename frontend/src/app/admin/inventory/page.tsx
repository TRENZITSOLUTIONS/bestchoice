'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminInventoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/products/?page_size=100').then((r) => r.data),
  });

  const outOfStock = data?.results?.filter((p: any) => !p.in_stock) || [];
  const inStock = data?.results?.filter((p: any) => p.in_stock) || [];

  const exportCSV = () => {
    if (!data?.results) return;
    const headers = ['Product ID', 'Name', 'Stock Status'];
    const rows = data.results.map((p: any) => [p.auto_product_id, p.name, p.in_stock ? 'In Stock' : 'Out of Stock']);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Inventory exported');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Export CSV</button>
      </div>

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
