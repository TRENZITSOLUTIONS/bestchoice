import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Order, OrderDetail, OrderTracking } from '@/lib/types';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get<Order[]>('/orders/');
      return res.data;
    },
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await api.get<OrderDetail>(`/orders/${orderId}/`);
      return res.data;
    },
    enabled: !!orderId,
  });
}

export function useOrderTracking(orderId: string) {
  return useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      const res = await api.get<OrderTracking>(`/orders/${orderId}/track/`);
      return res.data;
    },
    enabled: !!orderId,
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (payload: {
      shipping_address: Record<string, string>;
      delivery_type: 'home' | 'store_pickup';
      notes?: string;
      loyalty_points_used?: number;
    }) => {
      const res = await api.post('/checkout/', payload);
      return res.data;
    },
  });
}

export function useVerifyPayment() {
  return useMutation({
    mutationFn: async (payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      const res = await api.post('/payment/verify/', payload);
      return res.data;
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post(`/orders/${orderId}/cancel/`);
      return res.data;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
}

export function useRequestRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const res = await api.post(`/orders/${orderId}/refund/`, { reason });
      return res.data;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
}
