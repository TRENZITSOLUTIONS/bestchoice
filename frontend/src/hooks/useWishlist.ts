import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get<WishlistItem[]>('/wishlist/');
      return res.data;
    },
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
