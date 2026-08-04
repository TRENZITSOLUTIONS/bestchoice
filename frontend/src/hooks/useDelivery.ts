import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DeliveryCheck {
  pincode: string;
  zone?: 'tamilnadu' | 'outside_tamilnadu';
  delivery_available: boolean;
  delivery_type?: string;
  estimated_days?: string;
  store_pickup?: boolean;
  cod_available?: boolean;
  delivery_charge: string | null;
  /** Order subtotal at or above which this zone delivers free. */
  free_delivery_threshold?: string;
  message?: string;
}

/**
 * Quote delivery for a pincode. Pass `orderTotal` to have the free-delivery
 * threshold applied; without it the endpoint quotes the full charge.
 */
export function useDeliveryCheck(pincode: string, state?: string, orderTotal?: number) {
  return useQuery({
    queryKey: ['delivery-check', pincode, state, orderTotal],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (state) params.state = state;
      if (orderTotal !== undefined) params.order_total = String(orderTotal);

      const res = await api.get<DeliveryCheck>(`/delivery/check/${pincode}/`, {
        params: Object.keys(params).length ? params : undefined,
      });
      return res.data;
    },
    enabled: pincode.length === 6,
  });
}
