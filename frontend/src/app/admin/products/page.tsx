'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/products/?page_size=100').then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/admin/products/${id}/`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Updated'); setEditId(null); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const exportCSV = () => {
    if (!data?.results) return;
    const headers = ['Product ID', 'Name', 'Category', 'MRP', 'Selling Price', 'Discount %', 'Stock'];
    const rows = data.results.map((p: any) => [
      p.auto_product_id, p.name, p.category, p.mrp, p.selling_price, p.discount_percent, p.in_stock ? 'In Stock' : 'Out of Stock',
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `products-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const startEdit = (p: any) => {
    setEditId(p.id);
    setEditData({ name: p.name, mrp: p.mrp, selling_price: p.selling_price, total_stock: p.in_stock ? 10 : 0 });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products Management</h1>
        <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Export CSV</button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-100 h-12 rounded-lg" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Product ID</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Price</th>
                <th className="text-left px-4 py-3 font-medium">Discount</th>
                <th className="text-left px-4 py-3 font-medium">Stock</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.results?.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  {editId === p.id ? (
                    <>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.auto_product_id}</td>
                      <td className="px-4 py-3">
                        <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
                      </td>
                      <td className="px-4 py-3">{p.category}</td>
                      <td className="px-4 py-3 space-y-1">
                        <input value={editData.selling_price} onChange={(e) => setEditData({ ...editData, selling_price: e.target.value })} className="border rounded px-2 py-1 w-20 text-sm" />
                        <input value={editData.mrp} onChange={(e) => setEditData({ ...editData, mrp: e.target.value })} className="border rounded px-2 py-1 w-20 text-sm ml-1" />
                      </td>
                      <td className="px-4 py-3 text-green-600">{p.discount_percent}%</td>
                      <td className="px-4 py-3">
                        <input value={editData.total_stock} onChange={(e) => setEditData({ ...editData, total_stock: e.target.value })} className="border rounded px-2 py-1 w-16 text-sm" type="number" />
                      </td>
                      <td className="px-4 py-3 flex gap-1">
                        <button onClick={() => mutation.mutate({ id: p.id, data: editData })} className="text-green-600 text-xs hover:underline">Save</button>
                        <button onClick={() => setEditId(null)} className="text-gray-500 text-xs hover:underline">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.auto_product_id}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{p.category}</td>
                      <td className="px-4 py-3">
                        ₹{p.selling_price}
                        <span className="text-gray-400 line-through ml-1 text-xs">₹{p.mrp}</span>
                      </td>
                      <td className="px-4 py-3 text-green-600">{p.discount_percent}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${p.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => startEdit(p)} className="text-blue-600 text-xs hover:underline">Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
