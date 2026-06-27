export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">BestChoice</h3>
            <p className="text-sm">Premium fashion and cosmetics across Tamilnadu.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Shop</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="/products?category=mens-wear" className="hover:text-white">Men's Wear</a></li>
              <li><a href="/products?category=womens-wear" className="hover:text-white">Women's Wear</a></li>
              <li><a href="/products?category=kids-wear" className="hover:text-white">Kids Wear</a></li>
              <li><a href="/products?category=cosmetics" className="hover:text-white">Cosmetics</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="/cart" className="hover:text-white">Cart</a></li>
              <li><a href="/account/orders" className="hover:text-white">Orders</a></li>
              <li><a href="/account/wishlist" className="hover:text-white">Wishlist</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Contact</h4>
            <ul className="space-y-1 text-sm">
              <li>WhatsApp: 9876543210</li>
              <li>Store pickup in Chennai, Coimbatore, Madurai</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-6 pt-4 text-center text-sm">
          © 2026 BestChoice. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
