'use client';

import { use, useMemo, useState } from 'react';
import { useProduct } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useAddToWishlist } from '@/hooks/useWishlist';
import { useReviews, useWriteReview } from '@/hooks/useReviews';
import { useDeliveryCheck } from '@/hooks/useDelivery';
import { useAuthStore } from '@/store/auth';
import { ProductCard } from '@/components/ProductCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: product, isLoading } = useProduct(slug);
  const { data: reviewsData } = useReviews(slug);
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [shade, setShade] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const colors = useMemo(() => [...new Set(product?.variants.map((v) => v.color).filter(Boolean))], [product]);
  const sizes = useMemo(() => [...new Set(product?.variants.map((v) => v.size).filter(Boolean))], [product]);
  const shades = useMemo(() => [...new Set(product?.variants.map((v) => v.shade).filter(Boolean))], [product]);

  const selectedVariant = useMemo(() => {
    if (!product) return undefined;
    return product.variants.find(
      (v) =>
        (colors.length === 0 || v.color === (color ?? colors[0])) &&
        (sizes.length === 0 || v.size === (size ?? sizes[0])) &&
        (shades.length === 0 || v.shade === (shade ?? shades[0]))
    );
  }, [product, color, size, shade, colors, sizes, shades]);

  const { data: delivery, isError: deliveryFailed } = useDeliveryCheck(pincode);

  if (isLoading) return <p className="text-center py-20 text-ink-soft">Loading...</p>;
  if (!product) return <p className="text-center py-20 text-ink-soft">Product not found.</p>;

  const images = product.images.length > 0 ? product.images : null;
  const stock = selectedVariant ? selectedVariant.stock : product.stock_status.badge === 'out_of_stock' ? 0 : 1;
  const stockBadge = selectedVariant
    ? selectedVariant.stock > 10
      ? { label: 'In Stock', color: 'text-leaf' }
      : selectedVariant.stock > 0
        ? { label: `Only ${selectedVariant.stock} Left`, color: 'text-marigold' }
        : { label: 'Out of Stock', color: 'text-kumkum' }
    : {
        label: product.stock_status.label,
        color: product.stock_status.badge === 'in_stock' ? 'text-leaf' : product.stock_status.badge === 'low_stock' ? 'text-marigold' : 'text-kumkum',
      };
  const productUrl = typeof window !== 'undefined' ? window.location.href : '';

  function handleAddToCart() {
    addToCart.mutate({ product: product!.id, variant: selectedVariant?.id, quantity: 1 });
  }

  function handleBuyNow() {
    addToCart.mutate(
      { product: product!.id, variant: selectedVariant?.id, quantity: 1 },
      { onSuccess: () => router.push('/cart') }
    );
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: product!.name, url: productUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(productUrl);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7">
      <p className="text-sm text-ink-soft pt-5">
        Home {product.category?.parent && <>/ {product.category.parent.name} </>}/{' '}
        {product.category?.name} / <span className="text-ink font-semibold">{product.name}</span>
      </p>

      <div className="grid sm:grid-cols-[0.9fr_1fr] gap-12 py-7">
        <div>
          <div className="relative aspect-[4/5] rounded bg-ivory-raised mb-3 overflow-hidden">
            {images ? (
              // Plain img: S3-hosted photo, not a host next/image is set up to optimize.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[activeImage].large || images[activeImage].image} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-ink-soft">{product.name}</div>
            )}
          </div>
          {images && images.length > 1 && (
            <div className="flex gap-2.5">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-17 h-17 rounded bg-ivory-raised border-2 overflow-hidden ${i === activeImage ? 'border-kumkum' : 'border-line'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumb || img.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs uppercase tracking-wide text-ink-soft">{product.brand?.name ?? 'Best Choice'}</span>
          <h1 className="display text-2xl sm:text-3xl mt-1.5 mb-2">{product.name}</h1>
          <div className="flex gap-4 items-center text-sm text-ink-soft mb-4.5">
            {product.rating.count > 0 && (
              <span>
                <span className="text-marigold">
                  {'★'.repeat(Math.round(product.rating.average))}
                  {'☆'.repeat(5 - Math.round(product.rating.average))}
                </span>{' '}
                {product.rating.average} ({product.rating.count} reviews)
              </span>
            )}
            <span>SKU: {selectedVariant?.sku ?? product.auto_product_id}</span>
          </div>

          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-3xl font-extrabold num">₹{product.pricing.selling_price}</span>
            {product.pricing.mrp !== product.pricing.selling_price && (
              <span className="text-ink-soft line-through num">₹{product.pricing.mrp}</span>
            )}
            {product.pricing.discount_percent > 0 && (
              <span className="bg-kumkum text-white text-xs font-bold px-2.5 py-1 rounded-sm">
                {product.pricing.discount_percent}% OFF
              </span>
            )}
          </div>
          <p className="text-xs text-ink-soft mb-6">
            {product.gst_included ? 'Inclusive of all taxes (GST included)' : 'Exclusive of GST'}
          </p>

          {colors.length > 0 && (
            <div className="mb-5.5">
              <h5 className="text-xs uppercase tracking-wide mb-2.5">Colour {color ?? colors[0]}</h5>
              <div className="flex gap-2 flex-wrap">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`px-3 py-1.5 rounded border text-sm ${
                      (color ?? colors[0]) === c ? 'border-kumkum bg-kumkum text-white' : 'border-line'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {shades.length > 0 && (
            <div className="mb-5.5">
              <h5 className="text-xs uppercase tracking-wide mb-2.5">Shade {shade ?? shades[0]}</h5>
              <div className="flex gap-2 flex-wrap">
                {shades.map((s) => (
                  <button
                    key={s}
                    onClick={() => setShade(s)}
                    className={`px-3 py-1.5 rounded border text-sm ${
                      (shade ?? shades[0]) === s ? 'border-kumkum bg-kumkum text-white' : 'border-line'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mb-5.5">
              <h5 className="text-xs uppercase tracking-wide mb-2.5">Size {size ?? sizes[0]}</h5>
              <div className="flex gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`w-11 h-10 rounded border text-sm font-semibold ${
                      (size ?? sizes[0]) === s ? 'border-kumkum bg-kumkum text-white' : 'border-line'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`text-sm font-bold mb-5.5 ${stockBadge.color}`}>● {stockBadge.label}</div>

          <div className="flex gap-3 mb-7.5">
            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="flex-1 border border-ink font-bold text-sm rounded py-3.5 disabled:opacity-40"
            >
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={stock === 0}
              className="flex-1 bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm rounded py-3.5 disabled:opacity-40"
            >
              Buy Now
            </button>
            <button
              onClick={() => addToWishlist.mutate(product.id)}
              aria-label="Add to wishlist"
              className="w-12 h-12 border border-line rounded flex-shrink-0"
            >
              ♡
            </button>
            <button onClick={handleShare} aria-label="Share" className="w-12 h-12 border border-line rounded flex-shrink-0">
              ⤴
            </button>
            <WhatsAppButton productName={product.name} productUrl={productUrl} />
          </div>

          {product.highlights.length > 0 && (
            <ul className="grid gap-2 text-sm mb-5.5">
              {product.highlights.map((h, i) => (
                <li key={i}>
                  <span className="text-leaf font-bold">✓</span> {h.text}
                </li>
              ))}
            </ul>
          )}

          <div className="border border-line rounded p-4.5 mb-3">
            <h5 className="text-sm font-semibold mb-1.5">🚚 Check delivery</h5>
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit pincode"
              className="border border-line rounded px-3 py-2 text-sm w-full mt-1.5 bg-card"
            />
            {deliveryFailed && pincode.length === 6 && (
              <p className="text-sm text-kumkum mt-2.5">
                Could not check that pincode right now - please try again.
              </p>
            )}
            {delivery && (
              <div className="text-sm mt-2.5 grid gap-0.5">
                {delivery.delivery_available ? (
                  <>
                    <p className="text-leaf font-semibold">
                      Delivers in {delivery.estimated_days ?? 'a few days'}
                      {delivery.city && ` to ${delivery.city}`}
                    </p>
                    {delivery.delivery_charge && (
                      <p className="text-ink-soft">
                        {Number(delivery.delivery_charge) > 0
                          ? `Delivery ₹${Number(delivery.delivery_charge).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                          : 'Free delivery'}
                        {delivery.free_delivery_threshold &&
                          Number(delivery.delivery_charge) > 0 &&
                          ` · free over ₹${Number(delivery.free_delivery_threshold).toLocaleString('en-IN')}`}
                      </p>
                    )}
                    {delivery.store_pickup && (
                      <p className="text-ink-soft">Store pickup available</p>
                    )}
                  </>
                ) : (
                  <p className="text-ink-soft">
                    {delivery.message || 'Delivery not available at this pincode'}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="border border-line rounded p-4.5">
            <h5 className="text-sm font-semibold mb-1.5">↩ 7-day easy exchange</h5>
            <p className="text-sm text-ink-soft">Size replacement available on unused items with tags</p>
          </div>
        </div>
      </div>

      {(product.description || product.short_description) && (
        <div className="max-w-[720px] py-7 border-t border-line">
          <p className="text-ink-soft mb-3">{product.short_description}</p>
          <div className="text-sm text-ink-soft" dangerouslySetInnerHTML={{ __html: product.description }} />
        </div>
      )}

      <div className="flex items-center gap-6 py-7 border-t border-b border-line">
        <div className="text-4xl font-extrabold num">{product.rating.average}</div>
        <div>
          <div className="text-marigold text-lg">
            {'★'.repeat(Math.round(product.rating.average))}
            {'☆'.repeat(5 - Math.round(product.rating.average))}
          </div>
          <div className="text-sm text-ink-soft">
            Based on {product.rating.count} {product.rating.count === 1 ? 'review' : 'reviews'}
          </div>
        </div>
        {isAuthenticated ? (
          <button onClick={() => setShowReviewForm((v) => !v)} className="ml-auto border border-line rounded px-5 py-2.5 text-sm font-bold">
            Write a review
          </button>
        ) : (
          <Link href="/auth/login" className="ml-auto border border-line rounded px-5 py-2.5 text-sm font-bold">
            Sign in to review
          </Link>
        )}
      </div>

      {showReviewForm && <ReviewForm slug={slug} onDone={() => setShowReviewForm(false)} />}

      <div className="py-6">
        {reviewsData?.results.map((r) => (
          <div key={r.id} className="border-b border-line py-4">
            <div className="text-marigold text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            <p className="text-sm font-semibold mt-1">{r.user_name} {r.is_verified_purchase && <span className="text-leaf text-xs font-normal">Verified Purchase</span>}</p>
            <p className="text-sm text-ink-soft mt-1">{r.text}</p>
          </div>
        ))}
      </div>

      {(product.related.similar.length > 0 || product.related.recommended.length > 0) && (
        <div className="pb-16">
          <p className="eyebrow">You may also like</p>
          <h2 className="display text-2xl mt-1.5 mb-5.5">Related products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5.5">
            {[...product.related.similar, ...product.related.recommended].slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewForm({ slug, onDone }: { slug: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const writeReview = useWriteReview(slug);

  // Moderation can be switched on in the admin, in which case a new review is held
  // as pending. Say so, otherwise the form just closes and the author sees nothing.
  if (awaitingApproval) {
    return (
      <div className="border border-line rounded p-5 mb-6">
        <p className="text-sm font-bold">Thanks! Your review has been submitted.</p>
        <p className="text-sm text-ink-soft mt-1">
          It is waiting to be approved by our team and will appear here once it is published.
        </p>
        <button type="button" onClick={onDone} className="mt-3 border border-line rounded px-5 py-2.5 text-sm font-bold">
          Done
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        writeReview.mutate(
          { rating, text },
          {
            onSuccess: (review) => {
              if (review.is_approved) {
                onDone();
              } else {
                setAwaitingApproval(true);
              }
            },
            onError: (err) => {
              setError(
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                  'Could not submit your review. Please try again.'
              );
            },
          }
        );
      }}
      className="border border-line rounded p-5 mb-6"
    >
      <div className="flex gap-1 mb-3 text-2xl text-marigold">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)}>
            {n <= rating ? '★' : '☆'}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
        placeholder="Share your experience with this product..."
        className="w-full border border-line rounded p-3 text-sm bg-card min-h-[90px]"
      />
      {error && <p className="text-sm text-kumkum mt-2">{error}</p>}
      <button type="submit" disabled={writeReview.isPending} className="mt-3 bg-kumkum text-white font-bold text-sm rounded px-5 py-2.5">
        {writeReview.isPending ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}
