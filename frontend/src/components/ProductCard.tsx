'use client';

import Link from 'next/link';
import { useAddToWishlist } from '@/hooks/useWishlist';
import { CategoryGlyph, GLYPH_WASH, glyphFor } from '@/components/CategoryGlyph';
import { rupees } from '@/lib/format';
import type { ProductListItem } from '@/lib/types';

export function ProductCard({ product, span2 = false }: { product: ProductListItem; span2?: boolean }) {
  const addToWishlist = useAddToWishlist();
  const glyph = glyphFor(product.category, product.name);

  return (
    <div className={`group ${span2 ? 'sm:col-span-2' : ''}`}>
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden border border-line transition-all duration-300 group-hover:border-marigold group-hover:-translate-y-1"
        style={product.primary_image ? undefined : { background: GLYPH_WASH[glyph] }}
      >
        {product.primary_image ? (
          // A plain img, not next/image: product photos live on S3 at a host
          // next/image can't optimize without also fetching and re-encoding
          // through its own proxy, which needs the exact bucket domain
          // allowed up front - not worth the fragility for a handful of
          // photos per product. See ImageManager for the same tradeoff.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primary_image}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            {/* Soft top-light over the wash so the tile has depth, not flat colour. */}
            <span
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(75% 55% at 50% 22%, rgba(255,255,255,0.09), transparent 60%)',
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-ink/60 transition-all duration-500 group-hover:text-ink/95 group-hover:scale-105">
              <CategoryGlyph glyph={glyph} size={76} />
            </span>
          </>
        )}

        {product.discount_percent > 0 && product.in_stock && (
          <span className="absolute top-3 left-3 z-10 bg-kumkum text-white text-[0.6rem] font-extrabold tracking-[0.1em] px-2.5 py-1">
            −{product.discount_percent}%
          </span>
        )}
        {!product.in_stock && (
          <span className="absolute top-3 left-3 z-10 bg-ink-faint text-ivory text-[0.6rem] font-extrabold tracking-[0.1em] px-2.5 py-1 uppercase">
            Sold out
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            addToWishlist.mutate(product.id);
          }}
          aria-label={`Add ${product.name} to wishlist`}
          className="absolute top-2.5 right-3 z-10 text-ink/55 hover:text-marigold-lit text-base leading-none transition-colors"
        >
          ♡
        </button>
      </Link>

      <div className="pt-4">
        {product.category && (
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-marigold">
            {product.category}
          </span>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-serif text-[1.08rem] leading-snug mt-1.5 mb-1 text-ink">{product.name}</h3>
        </Link>
        {product.brand && <p className="text-[0.76rem] text-ink-faint mb-2.5">{product.brand}</p>}

        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-[1.24rem] num text-ink">{rupees(product.selling_price)}</span>
          {product.mrp !== product.selling_price && (
            <span className="text-[0.8rem] text-ink-faint line-through num">{rupees(product.mrp)}</span>
          )}
        </div>

        {product.review_count > 0 && (
          <div className="text-[0.76rem] text-ink-faint mt-2">
            <span className="text-marigold">
              {'★'.repeat(Math.round(product.average_rating))}
              {'☆'.repeat(5 - Math.round(product.average_rating))}
            </span>{' '}
            {product.average_rating} ({product.review_count})
          </div>
        )}
      </div>
    </div>
  );
}
