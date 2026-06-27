'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/orders/').then((r) => r.data),
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/products/?page_size=100').then((r) => r.data),
  });

  const pendingOrders = orders?.filter((o: any) => o.status === 'pending') || [];
  const lowStock = products?.results?.filter((p: any) => p.in_stock === false) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold mt-1">{orders?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Pending Orders</p>
          <p className="text-3xl font-bold mt-1 text-orange-500">{pendingOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Products</p>
          <p className="text-3xl font-bold mt-1">{products?.count || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-3xl font-bold mt-1 text-red-500">{lowStock.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {orders?.slice(0, 5).map((order: any) => (
              <div key={order.order_id} className="flex justify-between text-sm border-b pb-2">
                <div>
                  <p className="font-medium">{order.order_id}</p>
                  <p className="text-gray-500 text-xs">{order.created_at?.split('T')[0]}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{order.total}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Low Stock Alerts</h2>
            <Link href="/admin/inventory" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">All products in stock</p>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex justify-between text-sm border-b pb-2">
                  <span>{p.name}</span>
                  <span className="text-red-500 font-medium">Out of Stock</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
