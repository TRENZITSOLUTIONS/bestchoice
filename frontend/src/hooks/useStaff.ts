import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CouponRow,
  DashboardStats,
  DeliveryRates,
  InventoryResponse,
  OrderListItem,
  PincodeResponse,
  Paginated,
  Refund,
  ReportsResponse,
  ReviewQueueResponse,
} from '@/lib/staff-types';

export function useDashboardStats(days = 7) {
  return useQuery({
    queryKey: ['staff', 'stats', days],
    queryFn: async () => (await api.get<DashboardStats>(`/admin/stats/?days=${days}`)).data,
  });
}

export function useStaffReports(days = 30) {
  return useQuery({
    queryKey: ['staff', 'reports', days],
    queryFn: async () => (await api.get<ReportsResponse>(`/admin/reports/?days=${days}`)).data,
  });
}

export function useStaffOrders(filters: Record<string, string> = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v)
  ).toString();
  return useQuery({
    queryKey: ['staff', 'orders', filters],
    queryFn: async () =>
      (await api.get<Paginated<OrderListItem>>(`/admin/orders/?${params}`)).data,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status, note }: { orderId: string; status: string; note?: string }) =>
      (await api.post(`/admin/orders/${orderId}/status/`, { status, note })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useBulkShip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      order_ids: string[];
      tracking_provider?: string;
      tracking_id?: string;
    }) => (await api.post('/admin/orders/bulk-ship/', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useStaffRefunds(status = '') {
  return useQuery({
    queryKey: ['staff', 'refunds', status],
    queryFn: async () =>
      (await api.get<Paginated<Refund>>(`/admin/refunds/${status ? `?status=${status}` : ''}`)).data,
  });
}

export function useUpdateRefundStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ refundId, status }: { refundId: number; status: string }) =>
      (await api.post(`/admin/refunds/${refundId}/status/`, { status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useInventory(filters: Record<string, string> = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v)
  ).toString();
  return useQuery({
    queryKey: ['staff', 'inventory', filters],
    queryFn: async () => (await api.get<InventoryResponse>(`/admin/inventory/?${params}`)).data,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: Record<string, unknown>) =>
      (await api.post('/admin/products/', fields)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'inventory'] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: number } & Record<string, unknown>) =>
      (await api.patch(`/admin/products/${id}/`, fields)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useReviewQueue(pendingOnly = true) {
  return useQuery({
    queryKey: ['staff', 'reviews', pendingOnly],
    queryFn: async () =>
      (await api.get<ReviewQueueResponse>(`/admin/reviews/${pendingOnly ? '?pending=true' : ''}`)).data,
  });
}

export function useModerateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, action }: { reviewId: number; action: 'approve' | 'reject' }) =>
      (await api.post(`/admin/reviews/${reviewId}/moderate/`, { action })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useStaffCoupons() {
  return useQuery({
    queryKey: ['staff', 'coupons'],
    queryFn: async () => (await api.get<{ results: CouponRow[] }>('/admin/coupons/')).data.results,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post('/admin/coupons/', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'coupons'] }),
  });
}

export function useToggleCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) =>
      (await api.patch(`/admin/coupons/${id}/`, { is_active })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'coupons'] }),
  });
}

export function useDeliveryRates() {
  return useQuery({
    queryKey: ['staff', 'delivery-rates'],
    queryFn: async () => (await api.get<DeliveryRates>('/admin/delivery-rates/')).data,
  });
}

export function useUpdateTamilNaduRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: Record<string, string>) =>
      (await api.patch('/admin/delivery-rates/tamil-nadu/', fields)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'delivery-rates'] }),
  });
}

export function useUpdateOutsideStateRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: Record<string, string | boolean>) =>
      (await api.patch('/admin/delivery-rates/outside-tamil-nadu/', fields)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'delivery-rates'] }),
  });
}

export function useStaffPincodes(search = '') {
  return useQuery({
    queryKey: ['staff', 'pincodes', search],
    queryFn: async () =>
      (await api.get<PincodeResponse>(`/admin/pincodes/${search ? `?search=${search}` : ''}`)).data,
  });
}
