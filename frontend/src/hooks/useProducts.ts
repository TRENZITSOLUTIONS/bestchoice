import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Category, Brand, ProductListItem, ProductDetail } from '@/lib/types';

export interface ProductFilters {
  category?: string;
  brand?: string;
  selling_price_gte?: string;
  selling_price_lte?: string;
  color?: string;
  size?: string;
  discount?: string;
  fabric?: string;
  fit?: string;
  sleeve_type?: string;
  occasion?: string;
  shade?: string;
  skin_type?: string;
  compatible_device?: string;
  availability?: 'in_stock' | 'out_of_stock';
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: string;
}

function toQueryParams(filters: ProductFilters) {
  const params: Record<string, string> = {};
  if (filters.category) params.category__slug = filters.category;
  if (filters.brand) params.brand__slug = filters.brand;
  if (filters.selling_price_gte) params.selling_price__gte = filters.selling_price_gte;
  if (filters.selling_price_lte) params.selling_price__lte = filters.selling_price_lte;
  if (filters.color) params.color = filters.color;
  if (filters.size) params.size = filters.size;
  if (filters.discount) params.discount = filters.discount;
  if (filters.fabric) params.fabric = filters.fabric;
  if (filters.fit) params.fit = filters.fit;
  if (filters.sleeve_type) params.sleeve_type = filters.sleeve_type;
  if (filters.occasion) params.occasion = filters.occasion;
  if (filters.shade) params.shade = filters.shade;
  if (filters.skin_type) params.skin_type = filters.skin_type;
  if (filters.compatible_device) params.compatible_device = filters.compatible_device;
  if (filters.availability) params.availability = filters.availability;
  if (filters.search) params.search = filters.search;
  if (filters.ordering) params.ordering = filters.ordering;
  if (filters.page) params.page = String(filters.page);
  if (filters.page_size) params.page_size = filters.page_size;
  return params;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const res = await api.get<{ count: number; next: string | null; previous: string | null; results: ProductListItem[] }>(
        '/products/',
        { params: toQueryParams(filters) }
      );
      return res.data;
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await api.get<ProductDetail>(`/products/${slug}/`);
      return res.data;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<{ results: Category[] }>('/categories/');
      return res.data.results;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get<{ results: Brand[] }>('/brands/');
      return res.data.results;
    },
    staleTime: 5 * 60 * 1000,
  });
}
