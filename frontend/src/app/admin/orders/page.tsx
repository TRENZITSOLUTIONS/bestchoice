'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/orders/').then((r) => r.data),
  });

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/status/`, { status });
      toast.success(`Order ${orderId} → ${status}`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const filtered = filter
    ? data?.filter((o: any) => o.status === filter)
    : data;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>

      <div className="flex gap-2 mb-4">
        {['', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-100 h-16 rounded-lg" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Order ID</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Payment</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered?.map((order: any) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{order.order_id}</td>
                  <td className="px-4 py-3 text-gray-500">{order.created_at?.split('T')[0]}</td>
                  <td className="px-4 py-3">₹{order.total}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusUpdate(order.order_id, 'confirmed')} className="text-blue-600 text-xs hover:underline">Confirm</button>
                          <button onClick={() => handleStatusUpdate(order.order_id, 'cancelled')} className="text-red-600 text-xs hover:underline">Cancel</button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <button onClick={() => handleStatusUpdate(order.order_id, 'packed')} className="text-blue-600 text-xs hover:underline">Pack</button>
                      )}
                      {order.status === 'packed' && (
                        <button onClick={() => handleStatusUpdate(order.order_id, 'shipped')} className="text-blue-600 text-xs hover:underline">Ship</button>
                      )}
                      {order.status === 'shipped' && (
                        <button onClick={() => handleStatusUpdate(order.order_id, 'delivered')} className="text-green-600 text-xs hover:underline">Deliver</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
