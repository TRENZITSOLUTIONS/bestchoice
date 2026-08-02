import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LoyaltyBalance } from '@/lib/types';

export function useLoyaltyBalance() {
  return useQuery({
    queryKey: ['loyalty-balance'],
    queryFn: async () => {
      const res = await api.get<LoyaltyBalance>('/loyalty/balance/');
      return res.data;
    },
  });
}

export interface LoyaltyTransaction {
  points: number;
  type: 'earned' | 'spent' | 'expired' | 'refund';
  description: string;
  created_at: string;
  remaining: number;
  expires_at: string | null;
}

export function useLoyaltyTransactions() {
  return useQuery({
    queryKey: ['loyalty-transactions'],
    queryFn: async () => {
      const res = await api.get<{ results: LoyaltyTransaction[] }>('/loyalty/transactions/');
      return res.data.results;
    },
  });
}
