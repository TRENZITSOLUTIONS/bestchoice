'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AdminReportsPage() {
  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/orders/').then((r) => r.data),
  });

  const totalRevenue = orders?.reduce((sum: number, o: any) => sum + parseFloat(o.total), 0) || 0;
  const delivered = orders?.filter((o: any) => o.status === 'delivered').length || 0;
  const cancelled = orders?.filter((o: any) => o.status === 'cancelled').length || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Delivered Orders</p>
          <p className="text-3xl font-bold">{delivered}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Cancelled Orders</p>
          <p className="text-3xl font-bold text-red-500">{cancelled}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold mb-4">Order Status Breakdown</h2>
        <div className="space-y-3">
          {['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((status) => {
            const count = orders?.filter((o: any) => o.status === status).length || 0;
            const pct = orders?.length ? (count / orders.length * 100).toFixed(1) : 0;
            return (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{status}</span>
                  <span>{count} ({pct}%)</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
