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
  message?: string;
}

export function useDeliveryCheck(pincode: string, state?: string) {
  return useQuery({
    queryKey: ['delivery-check', pincode, state],
    queryFn: async () => {
      const res = await api.get<DeliveryCheck>(`/delivery/check/${pincode}/`, {
        params: state ? { state } : undefined,
      });
      return res.data;
    },
    enabled: pincode.length === 6,
  });
}
