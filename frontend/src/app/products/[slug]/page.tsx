'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { addItem } = useCartStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}/`).then((r) => r.data),
  });

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-8"><div className="animate-pulse h-96 bg-gray-100 rounded-lg" /></div>;
  if (!product) return <div className="text-center py-12">Product not found</div>;

  const selectedVariant = product.variants.find(
    (v: any) => (selectedColor ? v.color === selectedColor : true) && (selectedSize ? v.size === selectedSize : true)
  );

  const stock = selectedVariant?.stock ?? product.stock_status;
  const stockDisplay = typeof stock === 'number'
    ? stock > 10 ? 'In Stock' : stock > 0 ? `Only ${stock} Left` : 'Out of Stock'
    : product.stock_status.label;

  const handleAddToCart = async () => {
    try {
      await api.post('/cart/items/', {
        product: product.id,
        variant_id: selectedVariant?.id || null,
        quantity,
      });
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    try {
      await api.post('/cart/items/', {
        product: product.id,
        variant_id: selectedVariant?.id || null,
        quantity,
      });
      window.location.href = '/checkout';
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div
            className="bg-gray-100 rounded-xl h-96 flex items-center justify-center mb-4 cursor-zoom-in overflow-hidden"
            onClick={() => product.images?.length > 0 && setLightboxIndex(0)}
          >
            {product.images?.[0] ? (
              <img loading="lazy" src={product.images[0].image} alt={product.name}
                className="w-full h-full object-cover rounded-xl hover:scale-105 transition-transform duration-300" />
            ) : (
              <span className="text-6xl">📷</span>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.slice(0, 6).map((img: any, i: number) => (
                <div key={img.id}
                  onClick={() => setLightboxIndex(i)}
                  className={`bg-gray-100 rounded-lg h-20 w-20 flex-shrink-0 flex items-center justify-center cursor-pointer border-2 overflow-hidden ${lightboxIndex === i ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}>
                  <img loading="lazy" src={img.thumb || img.image} alt={img.alt_text} className="w-full h-full object-cover rounded-lg" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.brand && (
            <p className="text-gray-500 text-sm mt-1">{product.brand.name}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-yellow-500">{'★'.repeat(Math.round(product.rating?.average || 0))}</span>
            <span className="text-sm text-gray-500">({product.rating?.count || 0} reviews)</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">SKU: {selectedVariant?.sku || product.auto_product_id}</p>

          {/* Pricing */}
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">₹{product.pricing.selling_price}</span>
              <span className="text-gray-400 line-through">₹{product.pricing.mrp}</span>
              <span className="text-green-600 font-medium text-sm">{product.pricing.discount_percent}% OFF</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{product.gst_included ? 'GST Included' : 'GST extra'}</p>
          </div>

          {/* Variants */}
          {product.available_colors?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Color: {selectedColor}</p>
              <div className="flex gap-2">
                {product.available_colors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => { setSelectedColor(color); setSelectedSize(''); }}
                    className={`px-4 py-1.5 rounded-lg text-sm border ${selectedColor === color ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-gray-500'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.available_sizes?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Size: {selectedSize}</p>
              <div className="flex gap-2">
                {product.available_sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-1.5 rounded-lg text-sm border ${selectedSize === size ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-gray-500'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="mt-4">
            <span className={`text-sm font-medium ${stockDisplay === 'Out of Stock' ? 'text-red-500' : stockDisplay.includes('Only') ? 'text-orange-500' : 'text-green-600'}`}>
              {stockDisplay}
            </span>
          </div>

          {/* Description */}
          {product.short_description && (
            <p className="mt-4 text-gray-600">{product.short_description}</p>
          )}
          {product.description && (
            <details className="mt-2">
              <summary className="text-sm text-blue-600 cursor-pointer">Full Description</summary>
              <div className="mt-2 text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: product.description }} />
            </details>
          )}

          {/* Highlights */}
          {product.highlights?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Highlights</h3>
              <ul className="space-y-1">
                {product.highlights.map((h: any, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✔</span> {h.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleAddToCart}
              disabled={stockDisplay === 'Out of Stock'}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300"
            >
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={stockDisplay === 'Out of Stock'}
              className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300"
            >
              Buy Now
            </button>
            <button className="p-2.5 border rounded-lg hover:bg-gray-50" title="Wishlist">❤️</button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: product.name, text: product.short_description || '', url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied!');
                }
              }}
              className="p-2.5 border rounded-lg hover:bg-gray-50"
              title="Share"
            >
              📤
            </button>
            <a
              href={`https://wa.me/919876543210?text=Hi%2C%20I%27m%20interested%20in%20${product.name}%20-%20${typeof window !== 'undefined' ? window.location.href : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 border rounded-lg hover:bg-gray-50"
              title="WhatsApp Enquiry"
            >
              💬
            </a>
          </div>

          {/* Pincode Checker */}
          <PincodeChecker />

          {/* Return Policy */}
          {product.return_policy && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm">
              <p>🔄 {product.return_policy.exchange_days}-Day Easy Exchange</p>
              {product.return_policy.size_replacement && <p>👕 Size Replacement Available</p>}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
        <ReviewSection productSlug={product.slug} product={product} />
      </div>

      {/* Related Products */}
      {product.related && (
        <div className="mt-12 pb-24 md:pb-12">
          <h2 className="text-xl font-bold mb-4">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...(product.related.similar || []), ...(product.related.recommended || [])].slice(0, 4).map((rel: any) => (
              <Link key={rel.id} href={`/products/${rel.slug}`} className="bg-gray-50 rounded-lg p-3 hover:shadow-md group">
                {rel.primary_image ? (
                  <img loading="lazy" src={rel.primary_image} alt={rel.name} className="w-full h-32 object-cover rounded-lg mb-2 group-hover:opacity-90" />
                ) : (
                  <div className="bg-gray-200 rounded-lg h-32 mb-2" />
                )}
                <p className="text-sm font-medium truncate">{rel.name}</p>
                <div className="flex items-center gap-1">
                  <p className="text-blue-600 font-bold">₹{rel.selling_price}</p>
                  {rel.mrp > rel.selling_price && (
                    <p className="text-xs text-gray-400 line-through">₹{rel.mrp}</p>
                  )}
                </div>
                {rel.discount_percent > 0 && (
                  <p className="text-xs text-green-600">{rel.discount_percent}% OFF</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && product.images?.[lightboxIndex] && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10" onClick={() => setLightboxIndex(null)}>✕</button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-gray-300 z-10 disabled:opacity-30"
            disabled={lightboxIndex === 0}
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.max(0, lightboxIndex - 1)); }}>‹</button>
          <img loading="lazy" src={product.images[lightboxIndex].image} alt={product.images[lightboxIndex].alt_text || product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-gray-300 z-10 disabled:opacity-30"
            disabled={lightboxIndex === product.images.length - 1}
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.min(product.images.length - 1, lightboxIndex + 1)); }}>›</button>
          <p className="absolute bottom-4 text-white text-sm">{lightboxIndex + 1} / {product.images.length}</p>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      {stockDisplay !== 'Out of Stock' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 md:hidden z-50">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <div className="flex-1">
              <p className="text-lg font-bold text-blue-600">₹{product.pricing.selling_price}</p>
              <p className="text-xs text-gray-400 line-through">₹{product.pricing.mrp}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full border text-lg leading-none"
              >−</button>
              <span className="w-6 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full border text-lg leading-none"
              >+</button>
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PincodeChecker() {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    if (pincode.length !== 6) return;
    setLoading(true);
    setChecked(true);
    try {
      const res = await api.get(`/delivery/check/${pincode}/`);
      setResult(res.data);
    } catch {
      setResult({ delivery_available: false, message: 'Could not check pincode' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4">
      <p className="text-sm font-medium mb-2">Check Delivery Availability</p>
      <div className="flex gap-2">
        <input
          type="text"
          maxLength={6}
          value={pincode}
          onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); setChecked(false); }}
          placeholder="Enter pincode"
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        />
        <button
          onClick={handleCheck}
          disabled={pincode.length !== 6 || loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? '...' : 'Check'}
        </button>
      </div>
      {checked && result && (
        <div className={`mt-2 text-sm ${result.delivery_available ? 'text-green-600' : 'text-red-500'}`}>
          {result.delivery_available ? (
            <div className="space-y-1">
              <p>✅ Delivery available</p>
              {result.delivery_type === 'same_day' && <p>🚚 Same Day Delivery</p>}
              {result.estimated_days && <p>📦 {result.estimated_days}</p>}
              {result.store_pickup && <p>🏪 Store pickup available</p>}
              {result.cod_available && <p>💵 Cash on Delivery available</p>}
              {result.delivery_charge && <p>Delivery charge: ₹{result.delivery_charge}</p>}
            </div>
          ) : (
            <p>❌ {result.message || 'Delivery not available at this pincode'}</p>
          )}
        </div>
      )}
    </div>
  );
}

function WriteReview({ productSlug, onSubmitted }: { productSlug: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      await api.post(`/products/${productSlug}/reviews/`, { rating, text });
      toast.success('Review submitted!');
      setRating(0); setText(''); setSubmitting(false);
      onSubmitted();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h3 className="font-medium text-sm mb-3">Write a Review</h3>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
            className={`text-2xl ${star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition`}>
            ★
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Share your experience with this product..."
        className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
      <button onClick={handleSubmit} disabled={submitting}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}

function ReviewSection({ productSlug, product }: { productSlug: string; product: any }) {
  const { data: reviewsData, refetch } = useQuery({
    queryKey: ['reviews', productSlug],
    queryFn: () => api.get(`/products/${productSlug}/reviews/`).then((r) => r.data),
  });

  if (!reviewsData) return <p>Loading reviews...</p>;

  return (
    <div>
      <WriteReview productSlug={productSlug} onSubmitted={() => refetch()} />
      <div className="flex items-center gap-4 mb-4">
        <span className="text-3xl font-bold">{reviewsData.average_rating}</span>
        <div>
          <span className="text-yellow-500 text-xl">{'★'.repeat(Math.round(reviewsData.average_rating))}</span>
          <p className="text-sm text-gray-500">{reviewsData.total_reviews} reviews</p>
        </div>
      </div>
      <div className="space-y-4">
        {reviewsData.results?.slice(0, 5).map((review: any) => (
          <div key={review.id} className="border-b pb-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
              <span className="font-medium text-sm">{review.user_name}</span>
              {review.is_verified_purchase && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Verified</span>}
            </div>
            <p className="text-sm text-gray-600 mt-1">{review.text}</p>
            {review.images?.length > 0 && (
              <div className="flex gap-2 mt-2">
                {review.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt="Review" className="h-16 w-16 object-cover rounded" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
