'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/wishlist/').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const handleRemove = async (productId: number) => {
    await api.delete(`/wishlist/${productId}/`);
    toast.success('Removed from wishlist');
    refetch();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 h-48 rounded-lg animate-pulse" />)}
        </div>
      ) : data?.length === 0 ? (
        <p className="text-gray-500">Your wishlist is empty</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-3">
              <Link href={`/products/${item.product_slug}`}>
                <div className="bg-gray-100 rounded-lg h-32 mb-2 flex items-center justify-center">
                  {item.product_image ? <img src={item.product_image} alt="" className="w-full h-full object-cover rounded-lg" /> : '📷'}
                </div>
                <h3 className="text-sm font-medium">{item.product_name}</h3>
                <p className="text-blue-600 font-bold text-sm">₹{item.product_price}</p>
              </Link>
              <button onClick={() => handleRemove(item.product)} className="text-red-500 text-xs mt-2 hover:underline">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
