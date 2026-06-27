import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'BestChoice - Fashion & Cosmetics',
  description: 'Shop premium fashion and cosmetics in Tamilnadu. Free delivery above ₹999, 7-day exchange, same-day delivery in Chennai.',
  openGraph: {
    title: 'BestChoice - Fashion & Cosmetics',
    description: 'Shop premium fashion and cosmetics in Tamilnadu',
  },
};

const heroCategories = [
  { name: "Men's Wear", slug: 'mens-wear', image: '/images/mens.jpg', count: 'Shirts, T-Shirts, Jeans & more' },
  { name: "Women's Wear", slug: 'womens-wear', image: '/images/womens.jpg', count: 'Sarees, Kurtis, Dresses & more' },
  { name: 'Kids Wear', slug: 'kids-wear', image: '/images/kids.jpg', count: 'Stylish outfits for kids' },
  { name: 'Cosmetics', slug: 'cosmetics', image: '/images/cosmetics.jpg', count: 'Beauty & personal care' },
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Premium Fashion & Cosmetics</h1>
          <p className="text-lg mb-8 text-blue-100">Free delivery on orders above ₹999 across Tamilnadu</p>
          <Link
            href="/products"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Shop Now
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {heroCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="bg-gray-200 rounded-lg h-40 mb-4 flex items-center justify-center text-4xl">
                {cat.name === "Men's Wear" ? '👔' : cat.name === "Women's Wear" ? '👗' : cat.name === 'Kids Wear' ? '👕' : '💄'}
              </div>
              <h3 className="font-semibold text-lg group-hover:text-blue-600">{cat.name}</h3>
              <p className="text-sm text-gray-500">{cat.count}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Why Shop with BestChoice?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🚚</div>
              <h3 className="font-semibold">Free Delivery</h3>
              <p className="text-sm text-gray-500">On orders above ₹999 across Tamilnadu</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold">7-Day Exchange</h3>
              <p className="text-sm text-gray-500">Easy returns & size replacement</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">💳</div>
              <h3 className="font-semibold">Secure Payments</h3>
              <p className="text-sm text-gray-500">Razorpay UPI, cards & net banking</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
