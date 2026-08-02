'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAddToWishlist } from '@/hooks/useWishlist';
import type { ProductListItem } from '@/lib/types';

export function ProductCard({ product, span2 = false }: { product: ProductListItem; span2?: boolean }) {
  const addToWishlist = useAddToWishlist();

  return (
    <div className={`bg-card border border-line rounded overflow-hidden shadow-sm ${span2 ? 'sm:col-span-2' : ''}`}>
      <Link href={`/products/${product.slug}`} className="block relative aspect-[3/4] bg-ivory-raised">
        {product.primary_image ? (
          <Image
            src={product.primary_image}
            alt={product.name}
            fill
            sizes={span2 ? '(max-width: 640px) 100vw, 50vw' : '(max-width: 640px) 50vw, 25vw'}
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-soft text-sm">
            {product.name}
          </div>
        )}
        {product.discount_percent > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-kumkum text-white text-xs font-bold px-2 py-0.5 rounded-sm">
            {product.discount_percent}% OFF
          </span>
        )}
        {!product.in_stock && (
          <span className="absolute top-2.5 left-2.5 bg-ink-soft text-white text-xs font-bold px-2 py-0.5 rounded-sm">
            Out of stock
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            addToWishlist.mutate(product.id);
          }}
          aria-label="Add to wishlist"
          className="absolute top-2.5 right-2.5 w-7.5 h-7.5 rounded-full bg-ivory/90 border border-line flex items-center justify-center text-sm"
        >
          ♡
        </button>
      </Link>
      <div className="p-3.5 pb-4.5">
        {product.brand && <span className="text-xs uppercase tracking-wide text-ink-soft">{product.brand}</span>}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold mt-0.5 mb-2 leading-snug">{product.name}</h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="font-extrabold num">₹{product.selling_price}</span>
          {product.mrp !== product.selling_price && (
            <span className="text-xs text-ink-soft line-through num">₹{product.mrp}</span>
          )}
        </div>
        {product.review_count > 0 && (
          <div className="text-xs text-ink-soft mt-1.5">
            <span className="text-marigold">{'★'.repeat(Math.round(product.average_rating))}{'☆'.repeat(5 - Math.round(product.average_rating))}</span>{' '}
            {product.average_rating} ({product.review_count})
          </div>
        )}
      </div>
    </div>
  );
}
