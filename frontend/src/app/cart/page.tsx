'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart/').then((r) => r.data),
  });
  const [couponCode, setCouponCode] = useState('');

  const handleUpdateQty = async (itemId: number, qty: number) => {
    if (qty < 1) return;
    await api.put(`/cart/items/${itemId}/`, { quantity: qty });
    refetch();
  };

  const handleRemove = async (itemId: number) => {
    await api.delete(`/cart/items/${itemId}/`);
    refetch();
    toast.success('Item removed');
  };

  const handleApplyCoupon = async () => {
    try {
      const res = await api.post('/cart/apply-coupon/', { code: couponCode });
      toast.success(`Coupon applied! Discount: ₹${res.data.discount}`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse h-64 bg-gray-100 rounded-lg" /></div>;

  const items = data?.items || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link href="/products" className="text-blue-600 hover:underline">Continue Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="flex gap-4 bg-white rounded-lg shadow-sm p-4">
              <div className="bg-gray-100 rounded-lg h-24 w-24 flex items-center justify-center text-2xl shrink-0">
                {item.product_image ? <img src={item.product_image} alt="" className="w-full h-full object-cover rounded-lg" /> : '📷'}
              </div>
              <div className="flex-1">
                <Link href={`/products/${item.product_slug}`} className="font-medium hover:text-blue-600">
                  {item.product_name}
                </Link>
                {item.variant_label && <p className="text-sm text-gray-500">{item.variant_label}</p>}
                <p className="text-blue-600 font-bold mt-1">₹{item.price}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="px-2 py-1 border rounded text-sm">−</button>
                  <span className="font-medium">{item.quantity}</span>
                  <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} className="px-2 py-1 border rounded text-sm">+</button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">₹{item.total_price}</p>
                <button onClick={() => handleRemove(item.id)} className="text-red-500 text-sm mt-2 hover:underline">Remove</button>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm flex-1"
              />
              <button onClick={handleApplyCoupon} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">
                Apply
              </button>
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{data?.subtotal || '0'}</span>
              </div>
              {data?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{data.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>₹{data?.total || '0'}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="block text-center bg-orange-500 text-white py-2.5 rounded-lg font-medium mt-4 hover:bg-orange-600"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
