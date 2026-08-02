'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useCheckout, useVerifyPayment } from '@/hooks/useOrders';
import { useLoyaltyBalance } from '@/hooks/useLoyalty';
import { useDeliveryCheck } from '@/hooks/useDelivery';
import { useAuthStore } from '@/store/auth';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart } = useCart();
  const { data: loyalty } = useLoyaltyBalance();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkout = useCheckout();
  const verifyPayment = useVerifyPayment();

  const [deliveryType, setDeliveryType] = useState<'home' | 'store_pickup'>('home');
  const [pointsUsed, setPointsUsed] = useState(0);
  const [error, setError] = useState('');
  const [address, setAddress] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '',
    landmark: '', city: '', state: '', pincode: '',
  });

  const { data: delivery } = useDeliveryCheck(address.pincode, address.state);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-20 text-center">
        <h1 className="display text-2xl mb-3">Sign in to checkout</h1>
        <a href="/auth/login" className="inline-block bg-kumkum text-white font-bold text-sm px-6 py-3 rounded">
          Sign In
        </a>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return <p className="text-center py-20 text-ink-soft">Your cart is empty.</p>;
  }

  function updateField(key: keyof typeof address, value: string) {
    setAddress((a) => ({ ...a, [key]: value }));
  }

  function handlePlaceOrder() {
    setError('');
    if (deliveryType === 'home' && (!address.full_name || !address.phone || !address.address_line1 || !address.city || !address.state || address.pincode.length !== 6)) {
      setError('Please fill in all required address fields.');
      return;
    }

    checkout.mutate(
      {
        shipping_address: address,
        delivery_type: deliveryType,
        loyalty_points_used: pointsUsed || undefined,
      },
      {
        onSuccess: (order) => {
          const options = {
            key: order.razorpay_key_id,
            amount: order.amount_in_paise,
            currency: 'INR',
            name: 'Best Choice',
            description: `Order ${order.order_id}`,
            order_id: order.razorpay_order_id,
            handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
              verifyPayment.mutate(response, {
                onSuccess: () => router.push(`/account/orders/${order.order_id}`),
                onError: () => setError('Payment verification failed. Please contact support.'),
              });
            },
            prefill: { name: address.full_name, contact: address.phone },
            theme: { color: '#e14b1f' },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        },
        onError: (err: unknown) => {
          const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Checkout failed. Please try again.';
          setError(message);
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <h1 className="display text-2xl sm:text-3xl mt-7 mb-6">Checkout</h1>

      <div className="grid sm:grid-cols-[1fr_340px] gap-10 pb-16">
        <div>
          <div className="border border-line rounded p-5.5 mb-5">
            <h3 className="font-bold mb-4">Delivery</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex-1 border border-line rounded p-3.5 flex gap-2.5 cursor-pointer">
                <input type="radio" checked={deliveryType === 'home'} onChange={() => setDeliveryType('home')} className="mt-1" />
                <div>
                  <b className="text-sm">Home delivery</b>
                  <p className="text-xs text-ink-soft">Delivered to your address</p>
                </div>
              </label>
              <label className="flex-1 border border-line rounded p-3.5 flex gap-2.5 cursor-pointer">
                <input type="radio" checked={deliveryType === 'store_pickup'} onChange={() => setDeliveryType('store_pickup')} className="mt-1" />
                <div>
                  <b className="text-sm">Store pickup</b>
                  <p className="text-xs text-ink-soft">Free, at Spencer Plaza</p>
                </div>
              </label>
            </div>

            {deliveryType === 'home' && (
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Full name *" value={address.full_name} onChange={(e) => updateField('full_name', e.target.value)} className="border border-line rounded px-3 py-2.5 bg-card text-sm col-span-2 sm:col-span-1" />
                <input placeholder="Phone *" value={address.phone} onChange={(e) => updateField('phone', e.target.value)} className="border border-line rounded px-3 py-2.5 bg-card text-sm col-span-2 sm:col-span-1" />
                <input placeholder="Address line 1 *" value={address.address_line1} onChange={(e) => updateField('address_line1', e.target.value)} className="border border-line rounded px-3 py-2.5 bg-card text-sm col-span-2" />
                <input placeholder="Address line 2" value={address.address_line2} onChange={(e) => updateField('address_line2', e.target.value)} className="border border-line rounded px-3 py-2.5 bg-card text-sm col-span-2" />
                <input placeholder="Landmark" value={address.landmark} onChange={(e) => updateField('landmark', e.target.value)} className="border border-line rounded px-3 py-2.5 bg-card text-sm col-span-2 sm:col-span-1" />
                <input placeholder="City *" value={address.city} onChange={(e) => updateField('city', e.target.value)} className="border border-line rounded px-3 py-2.5 bg-card text-sm col-span-2 sm:col-span-1" />
                <input placeholder="State *" value={address.state} onChange={(e) => updateField('state', e.target.value)} className="border border-line rounded px-3 py-2.5 bg-card text-sm col-span-2 sm:col-span-1" />
                <input placeholder="Pincode *" value={address.pincode} onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} className="border border-line rounded px-3 py-2.5 bg-card text-sm col-span-2 sm:col-span-1" />
                {delivery && address.pincode.length === 6 && (
                  <p className={`col-span-2 text-xs ${delivery.delivery_available ? 'text-leaf' : 'text-kumkum'}`}>
                    {delivery.delivery_available
                      ? `Delivery charge: ₹${delivery.delivery_charge ?? '0'} · ${delivery.estimated_days}`
                      : 'Delivery is not available for this address'}
                  </p>
                )}
              </div>
            )}
          </div>

          {isAuthenticated && loyalty && loyalty.points > 0 && (
            <div className="border border-line rounded p-5.5">
              <h3 className="font-bold mb-2">Redeem Best Choice Rewards</h3>
              <p className="text-sm text-ink-soft mb-3">You have {loyalty.points} points (1 pt = ₹1)</p>
              <input
                type="number"
                min={0}
                max={loyalty.points}
                value={pointsUsed}
                onChange={(e) => setPointsUsed(Math.max(0, Math.min(loyalty.points, Number(e.target.value))))}
                className="border border-line rounded px-3 py-2.5 bg-card text-sm w-32"
              />
            </div>
          )}
        </div>

        <div className="border border-line rounded p-5.5 h-fit sticky top-5">
          <h3 className="font-bold mb-4">Order Summary</h3>
          <div className="flex justify-between text-sm text-ink-soft py-1.5">
            <span>Subtotal</span>
            <span className="num">₹{cart.subtotal}</span>
          </div>
          <div className="flex justify-between font-extrabold border-t border-line mt-2 pt-3.5">
            <span>Total</span>
            <span className="num">₹{cart.total}</span>
          </div>
          {error && <p className="text-kumkum text-xs mt-3">{error}</p>}
          <button
            onClick={handlePlaceOrder}
            disabled={checkout.isPending}
            className="w-full bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm rounded py-3.5 mt-4.5 disabled:opacity-50"
          >
            {checkout.isPending ? 'Placing order...' : 'Pay & Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
