'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoyaltyPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated]);

  const { data: balance } = useQuery({
    queryKey: ['loyalty-balance'],
    queryFn: () => api.get('/loyalty/balance/').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const { data: txns } = useQuery({
    queryKey: ['loyalty-txns'],
    queryFn: () => api.get('/loyalty/transactions/').then((r) => r.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Loyalty Points</h1>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-6 mb-6">
        <p className="text-sm opacity-90">Available Points</p>
        <p className="text-4xl font-bold">{balance?.points || 0}</p>
        <p className="text-sm mt-2 opacity-80">Lifetime earned: {balance?.lifetime_earned} | Spent: {balance?.lifetime_spent}</p>
      </div>

      <h2 className="font-semibold mb-4">Recent Transactions</h2>
      <div className="space-y-2">
        {txns?.results?.map((txn: any, i: number) => (
          <div key={i} className="flex justify-between bg-white rounded-lg shadow-sm p-3 text-sm">
            <div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${txn.type === 'earned' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {txn.type}
              </span>
              <span className="ml-2 text-gray-600">{txn.description}</span>
            </div>
            <span className={txn.points > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {txn.points > 0 ? '+' : ''}{txn.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
