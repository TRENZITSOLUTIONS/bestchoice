import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export interface WishlistItem {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  product_price: string;
  in_stock: boolean;
  created_at: string;
}

export function useWishlist() {
  // Guarded on auth: this gets called from ProductCard, which renders on
  // every listing page regardless of whether anyone's signed in - without
  // this it fired a doomed 401 request for every guest visitor.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get<WishlistItem[]>('/wishlist/');
      return res.data;
    },
    enabled: isAuthenticated,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: number) => {
      const res = await api.post('/wishlist/', { product: productId });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: number) => {
      await api.delete(`/wishlist/${productId}/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}
