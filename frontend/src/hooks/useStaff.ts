import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  BrandRow,
  CategoryRow,
  CouponRow,
  DashboardStats,
  DeliveryRates,
  InventoryResponse,
  OrderListItem,
  PincodeResponse,
  Paginated,
  ProductImageRow,
  Refund,
  ReportsResponse,
  ReviewQueueResponse,
  VariantRow,
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
      (await api.post<{ id: number }>('/admin/products/', fields)).data,
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

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/admin/products/${id}/`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'inventory'] }),
  });
}

export function useProductImages(productId: number | null) {
  return useQuery({
    queryKey: ['staff', 'product-images', productId],
    queryFn: async () => (await api.get(`/admin/products/${productId}/images/`)).data as ProductImageRow[],
    enabled: productId !== null,
  });
}

export function useUploadProductImage(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append('image', file);
      return (await api.post(`/admin/products/${productId}/images/`, body)).data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['staff', 'product-images', productId] }),
  });
}

export function useUpdateProductImage(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: number } & Record<string, unknown>) =>
      (await api.patch(`/admin/products/${productId}/images/${id}/`, fields)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['staff', 'product-images', productId] }),
  });
}

export function useDeleteProductImage(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.delete(`/admin/products/${productId}/images/${id}/`)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['staff', 'product-images', productId] }),
  });
}

export function useProductVariants(productId: number | null) {
  return useQuery({
    queryKey: ['staff', 'product-variants', productId],
    queryFn: async () => (await api.get(`/admin/products/${productId}/variants/`)).data as VariantRow[],
    enabled: productId !== null,
  });
}

function invalidateVariants(queryClient: ReturnType<typeof useQueryClient>, productId: number) {
  // A variant change also moves the product's rolled-up stock, which the
  // inventory list and overview cards both show.
  queryClient.invalidateQueries({ queryKey: ['staff', 'product-variants', productId] });
  queryClient.invalidateQueries({ queryKey: ['staff', 'inventory'] });
  queryClient.invalidateQueries({ queryKey: ['staff', 'stats'] });
}

export function useCreateProductVariant(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: Record<string, unknown>) =>
      (await api.post(`/admin/products/${productId}/variants/`, fields)).data,
    onSuccess: () => invalidateVariants(queryClient, productId),
  });
}

export function useUpdateProductVariant(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: number } & Record<string, unknown>) =>
      (await api.patch(`/admin/products/${productId}/variants/${id}/`, fields)).data,
    onSuccess: () => invalidateVariants(queryClient, productId),
  });
}

export function useDeleteProductVariant(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.delete(`/admin/products/${productId}/variants/${id}/`)).data,
    onSuccess: () => invalidateVariants(queryClient, productId),
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

export function useStaffCategories() {
  return useQuery({
    queryKey: ['staff', 'categories'],
    queryFn: async () => (await api.get<CategoryRow[]>('/admin/categories/')).data,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: Record<string, unknown>) =>
      (await api.post('/admin/categories/', fields)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'categories'] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: number } & Record<string, unknown>) =>
      (await api.patch(`/admin/categories/${id}/`, fields)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'categories'] }),
  });
}

export function useDeactivateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/admin/categories/${id}/`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'categories'] }),
  });
}

export function useUploadCategoryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const body = new FormData();
      body.append('image', file);
      return (await api.post<CategoryRow>(`/admin/categories/${id}/image/`, body)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'categories'] }),
  });
}

export function useStaffBrands() {
  return useQuery({
    queryKey: ['staff', 'brands'],
    queryFn: async () => (await api.get<BrandRow[]>('/admin/brands/')).data,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: Record<string, unknown>) =>
      (await api.post('/admin/brands/', fields)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'brands'] });
      // Also the public list (ProductOrganizationFields' typeable brand field
      // reads useBrands(), not useStaffBrands()) - without this a brand
      // created inline there wouldn't appear in its own datalist until reload.
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: number } & Record<string, unknown>) =>
      (await api.patch(`/admin/brands/${id}/`, fields)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'brands'] }),
  });
}

export function useDeactivateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/admin/brands/${id}/`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'brands'] }),
  });
}
