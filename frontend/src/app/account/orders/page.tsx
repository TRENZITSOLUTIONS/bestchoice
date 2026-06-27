'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders/').then((r) => r.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 h-24 rounded-lg" />)}
        </div>
      ) : data?.length === 0 ? (
        <p className="text-gray-500">No orders yet</p>
      ) : (
        <div className="space-y-4">
          {data?.map((order: any) => (
            <Link
              key={order.order_id}
              href={`/account/orders/${order.order_id}`}
              className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{order.order_id}</p>
                  <p className="text-sm text-gray-500">{order.created_at?.split('T')[0]}</p>
                  <p className="text-sm text-gray-500">{order.item_count} items</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{order.total}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.status}
                  </span>
                  <span className={`text-xs ml-1 px-2 py-0.5 rounded ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.payment_status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
