'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AdminReviewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => api.get('/reviews/mine/').then((r) => r.data),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reviews Management</h1>
      <p className="text-sm text-gray-500 mb-4">Approve/reject reviews from Django admin panel.</p>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500">Manage reviews via Django Admin at <code className="bg-gray-100 px-2 py-0.5 rounded">/django-admin/reviews/review/</code></p>
        </div>
      )}
    </div>
  );
}
