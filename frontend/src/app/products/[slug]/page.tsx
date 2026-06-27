'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
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
          <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center mb-4">
            {product.images?.[0] ? (
              <img src={product.images[0].medium || product.images[0].image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span className="text-6xl">📷</span>
            )}
          </div>
          <div className="flex gap-2">
            {product.images?.slice(0, 4).map((img: any) => (
              <div key={img.id} className="bg-gray-100 rounded-lg h-20 w-20 flex items-center justify-center cursor-pointer border-2 border-transparent hover:border-blue-500">
                <img src={img.thumb || img.image} alt={img.alt_text} className="w-full h-full object-cover rounded-lg" />
              </div>
            ))}
          </div>
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
            <button className="p-2.5 border rounded-lg hover:bg-gray-50" title="Share">📤</button>
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

          {/* Delivery */}
          {product.delivery && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <p>🚚 Same Day Delivery available in Chennai</p>
              <p>📦 {product.delivery.tamilnadu_days} days delivery across Tamilnadu</p>
              {product.delivery.store_pickup && <p>🏪 Store pickup available</p>}
            </div>
          )}

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
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...(product.related.similar || []), ...(product.related.recommended || [])].slice(0, 4).map((rel: any) => (
              <Link key={rel.id} href={`/products/${rel.slug}`} className="bg-gray-50 rounded-lg p-3 hover:shadow-md">
                <div className="bg-gray-200 rounded-lg h-32 mb-2" />
                <p className="text-sm font-medium">{rel.name}</p>
                <p className="text-blue-600 font-bold">₹{rel.selling_price}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewSection({ productSlug, product }: { productSlug: string; product: any }) {
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', productSlug],
    queryFn: () => api.get(`/products/${productSlug}/reviews/`).then((r) => r.data),
  });

  if (!reviewsData) return <p>Loading reviews...</p>;

  return (
    <div>
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
