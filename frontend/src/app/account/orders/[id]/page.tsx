'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated]);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}/`).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const { data: tracking } = useQuery({
    queryKey: ['order-tracking', id],
    queryFn: () => api.get(`/orders/${id}/track/`).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const handleCancel = async () => {
    try {
      await api.post(`/orders/${id}/cancel/`, { reason: 'Customer requested' });
      toast.success('Order cancelled');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleRefund = async () => {
    try {
      await api.post(`/orders/${id}/refund/`, { reason: 'Customer requested' });
      toast.success('Refund requested');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  if (!isAuthenticated) return null;
  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse h-64 bg-gray-100 rounded-lg" /></div>;
  if (!order) return <div className="text-center py-12">Order not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.order_id}</h1>
          <p className="text-sm text-gray-500">Placed on {order.created_at?.split('T')[0]}</p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded text-sm font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {order.status}
          </span>
          <span className={`ml-2 px-3 py-1 rounded text-sm ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {order.payment_status}
          </span>
        </div>
      </div>

      {tracking && (
        <div className="mb-6">
          {/* Tracking Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            {tracking.estimated_delivery && (
              <p className="text-sm text-gray-500 mb-3">Estimated delivery by {tracking.estimated_delivery}</p>
            )}
            <h2 className="font-semibold mb-4">Order Status</h2>
            <div className="relative">
              {tracking.status_history?.slice().reverse().map((entry: any, i: number) => (
                <div key={i} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${i === tracking.status_history.length - 1 ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-gray-300'}`} />
                    {i < tracking.status_history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 -mt-0.5">
                    <p className="text-sm font-medium capitalize">{entry.status}</p>
                    <p className="text-xs text-gray-500">{entry.created_at?.split('T')[0]} {entry.created_at?.split('T')[1]?.split('.')[0]}</p>
                    {entry.note && <p className="text-xs text-gray-400 mt-0.5">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.tracking && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="font-medium text-sm">Tracking: {order.tracking.provider}</p>
              <p className="text-sm">ID: {order.tracking.tracking_id}</p>
              {order.tracking.url && (
                <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">Track Order</a>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h2 className="font-semibold mb-3">Items</h2>
        {order.items?.map((item: any) => (
          <div key={item.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
            <span>{item.product_snapshot?.name} x{item.quantity}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="mt-3 space-y-1 text-sm border-t pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>}
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{order.total}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h2 className="font-semibold mb-2">Shipping Address</h2>
        <p className="text-sm text-gray-600">{order.shipping_address?.full_name}</p>
        <p className="text-sm text-gray-600">{order.shipping_address?.address_line1}</p>
        <p className="text-sm text-gray-600">{order.shipping_address?.city}, {order.shipping_address?.pincode}</p>
        <p className="text-sm text-gray-600">{order.shipping_address?.phone}</p>
      </div>

      {order.status === 'pending' && (
        <button onClick={handleCancel} className="bg-red-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-red-600">
          Cancel Order
        </button>
      )}
      {order.status === 'delivered' && (
        <button onClick={handleRefund} className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-orange-600">
          Request Refund
        </button>
      )}
    </div>
  );
}
