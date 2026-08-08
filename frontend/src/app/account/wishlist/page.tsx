'use client';

import Link from 'next/link';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { AccountNav } from '@/components/account/AccountNav';

export default function WishlistPage() {
  const { data: items, isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-7">
      <h1 className="display text-2xl mb-6">Your Wishlist</h1>
      <div className="grid sm:grid-cols-[200px_1fr] gap-8">
        <AccountNav />
        <div>
          {isLoading && <p className="text-sm text-ink-soft">Loading...</p>}
          {!isLoading && items?.length === 0 && <p className="text-sm text-ink-soft">Nothing saved yet.</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5.5">
            {items?.map((item) => (
              <div key={item.id} className="bg-card border border-line rounded overflow-hidden">
                <Link href={`/products/${item.product_slug}`} className="block relative aspect-[3/4] bg-ivory-raised">
                  {item.product_image ? (
                    // Plain img: S3-hosted photo, not a host next/image is set up to optimize.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product_image} alt={item.product_name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-ink-soft text-sm text-center p-2">
                      {item.product_name}
                    </div>
                  )}
                </Link>
                <div className="p-3.5">
                  <Link href={`/products/${item.product_slug}`}>
                    <h3 className="text-sm font-semibold mb-1.5">{item.product_name}</h3>
                  </Link>
                  <div className="flex justify-between items-center">
                    <span className="font-bold num">₹{item.product_price}</span>
                    <button onClick={() => removeFromWishlist.mutate(item.product)} className="text-xs text-kumkum-deep font-semibold">
                      Remove
                    </button>
                  </div>
                  {!item.in_stock && <p className="text-xs text-ink-soft mt-1">Out of stock</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
