import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import type { Cart } from '@/lib/types';

export function useCart() {
  const setCart = useCartStore((s) => s.setCart);
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await api.get<Cart>('/cart/');
      setCart(res.data);
      return res.data;
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ product, variant, quantity = 1 }: { product: number; variant?: number; quantity?: number }) => {
      const res = await api.post('/cart/items/', { product, variant, quantity });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      if (quantity < 1) {
        await api.delete(`/cart/items/${id}/`);
        return null;
      }
      const res = await api.put(`/cart/items/${id}/`, { quantity });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/cart/items/${id}/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post('/cart/apply-coupon/', { code });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete('/cart/remove-coupon/');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
}
