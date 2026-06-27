'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { isAuthenticated, user, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated]);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/auth/me/').then((r) => r.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/account/orders" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div className="text-3xl mb-3">📦</div>
          <h3 className="font-semibold">My Orders</h3>
          <p className="text-sm text-gray-500">View order history & tracking</p>
        </Link>
        <Link href="/account/wishlist" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div className="text-3xl mb-3">❤️</div>
          <h3 className="font-semibold">Wishlist</h3>
          <p className="text-sm text-gray-500">Saved products</p>
        </Link>
        <Link href="/account/loyalty" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div className="text-3xl mb-3">⭐</div>
          <h3 className="font-semibold">Loyalty Points</h3>
          <p className="text-sm text-gray-500">{profile?.loyalty_points || 0} points available</p>
        </Link>
      </div>
    </div>
  );
}
