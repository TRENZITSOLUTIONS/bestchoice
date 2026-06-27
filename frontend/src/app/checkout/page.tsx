'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart/').then((r) => r.data),
  });

  const [address, setAddress] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: 'Chennai',
    pincode: '600001',
    state: 'Tamilnadu',
  });
  const [deliveryType, setDeliveryType] = useState('home');

  const checkoutMutation = useMutation({
    mutationFn: () =>
      api.post('/checkout/', {
        shipping_address: address,
        delivery_type: deliveryType,
      }),
    onSuccess: (res) => {
      const { order_id, total, razorpay_order_id } = res.data;
      if (razorpay_order_id) {
        toast.success('Order placed! Integrate Razorpay SDK for payment.');
      }
      router.push(`/account/orders/${order_id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Checkout failed');
    },
  });

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-4">Shipping Address</h2>
          <div className="space-y-3">
            <input
              type="text" placeholder="Full Name"
              value={address.full_name}
              onChange={(e) => setAddress({ ...address, full_name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text" placeholder="Phone"
              value={address.phone}
              onChange={(e) => setAddress({ ...address, phone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text" placeholder="Address Line 1"
              value={address.address_line1}
              onChange={(e) => setAddress({ ...address, address_line1: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text" placeholder="Pincode"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <h2 className="font-semibold mt-6 mb-4">Delivery Type</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer">
              <input type="radio" name="delivery" checked={deliveryType === 'home'} onChange={() => setDeliveryType('home')} />
              <div>
                <p className="font-medium text-sm">Home Delivery</p>
                <p className="text-xs text-gray-500">2-3 days across Tamilnadu</p>
              </div>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer">
              <input type="radio" name="delivery" checked={deliveryType === 'store_pickup'} onChange={() => setDeliveryType('store_pickup')} />
              <div>
                <p className="font-medium text-sm">Store Pickup</p>
                <p className="text-xs text-gray-500">Pick up from nearest store</p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {cart.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product_name} x{item.quantity}</span>
                <span>₹{item.total_price}</span>
              </div>
            ))}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{cart.subtotal}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{cart.total}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending || !address.full_name || !address.phone || !address.address_line1}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium mt-4 hover:bg-orange-600 disabled:bg-gray-300"
          >
            {checkoutMutation.isPending ? 'Placing Order...' : 'Place Order'}
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Pay on delivery (COD) or online via Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
