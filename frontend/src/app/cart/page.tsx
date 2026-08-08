'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, useUpdateCartItem, useApplyCoupon, useRemoveCoupon } from '@/hooks/useCart';

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  if (isLoading) return <p className="text-center py-20 text-ink-soft">Loading...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-20 text-center">
        <h1 className="display text-2xl mb-3">Your bag is empty</h1>
        <p className="text-ink-soft mb-6">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/products" className="inline-block bg-kumkum text-white font-bold text-sm px-6 py-3 rounded">
          Start shopping
        </Link>
      </div>
    );
  }

  function handleApplyCoupon() {
    setCouponError('');
    applyCoupon.mutate(couponCode.trim(), {
      onSuccess: () => setCouponCode(''),
      onError: (err: unknown) => {
        // The endpoint answers with {message} for a valid-but-unusable coupon,
        // and DRF's {code: [...]} for one that doesn't exist.
        const data = (err as { response?: { data?: { message?: string; code?: string[] } } })
          ?.response?.data;
        setCouponError(data?.message || data?.code?.[0] || 'Invalid coupon code');
      },
    });
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7">
      <h1 className="display text-2xl sm:text-3xl mt-7 mb-6">Your Bag</h1>
      <div className="grid sm:grid-cols-[1fr_340px] gap-10 pb-16">
        <div>
          {cart.items.map((item) => (
            <div key={item.id} className="grid grid-cols-[84px_1fr_auto] gap-4 py-4.5 border-b border-line items-center">
              <div className="relative w-21 h-25 bg-ivory-raised rounded overflow-hidden">
                {item.product_image ? (
                  // Plain img: S3-hosted photo, not a host next/image is set up to optimize.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.product_image} alt={item.product_name} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[0.65rem] text-ink-soft text-center p-1">
                    {item.product_name}
                  </div>
                )}
              </div>
              <div>
                <Link href={`/products/${item.product_slug}`} className="text-sm font-semibold">
                  {item.product_name}
                </Link>
                {item.variant_label && <p className="text-xs text-ink-soft mt-1">{item.variant_label}</p>}
                <div className="inline-flex border border-line rounded mt-2">
                  <button
                    onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity - 1 })}
                    className="w-7.5 h-7.5"
                  >
                    −
                  </button>
                  <span className="w-8 flex items-center justify-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
                    className="w-7.5 h-7.5"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right font-extrabold num">₹{item.total_price}</div>
            </div>
          ))}
        </div>

        <div className="border border-line rounded p-5.5 h-fit sticky top-5">
          <h3 className="font-bold mb-4">Order Summary</h3>
          {cart.coupon ? (
            <div className="flex items-center gap-2 mb-4 border border-leaf/40 bg-leaf/10 rounded px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{cart.coupon.code}</p>
                <p className="text-xs text-ink-soft">{cart.coupon.label} applied</p>
              </div>
              <button
                onClick={() => removeCoupon.mutate()}
                disabled={removeCoupon.isPending}
                className="text-xs font-bold underline disabled:opacity-50 shrink-0"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-4">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                placeholder="Coupon code"
                className="flex-1 border border-line rounded px-3 py-2.5 bg-card text-sm"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={applyCoupon.isPending || !couponCode.trim()}
                className="border border-line rounded px-4 text-sm font-bold disabled:opacity-50"
              >
                {applyCoupon.isPending ? '...' : 'Apply'}
              </button>
            </div>
          )}
          {couponError && <p className="text-kumkum text-xs mb-3">{couponError}</p>}

          <div className="flex justify-between text-sm text-ink-soft py-1.5">
            <span>Subtotal ({cart.item_count} {cart.item_count === 1 ? 'item' : 'items'})</span>
            <span className="num">₹{cart.subtotal}</span>
          </div>
          {Number(cart.discount) > 0 && (
            <div className="flex justify-between text-sm text-leaf py-1.5">
              <span>Coupon discount</span>
              <span className="num">−₹{cart.discount}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold border-t border-line mt-2 pt-3.5">
            <span>Total</span>
            <span className="num">₹{cart.total}</span>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="w-full bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm rounded py-3.5 mt-4.5"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
