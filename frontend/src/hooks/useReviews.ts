import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Review {
  id: number;
  user: string;
  user_name: string;
  rating: number;
  text: string;
  images: string[];
  is_verified_purchase: boolean;
  // False while a review is held for staff approval. The public product list only
  // ever returns approved reviews; /reviews/mine/ returns the author's pending ones too.
  is_approved: boolean;
  created_at: string;
}

export interface ReviewsResponse {
  average_rating: number;
  total_reviews: number;
  distribution: Record<string, number>;
  results: Review[];
}

export function useReviews(slug: string) {
  return useQuery({
    queryKey: ['reviews', slug],
    queryFn: async () => {
      const res = await api.get<ReviewsResponse>(`/products/${slug}/reviews/`);
      return res.data;
    },
    enabled: !!slug,
  });
}

export function useWriteReview(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { rating: number; text: string; images?: string[] }) => {
      const res = await api.post<Review>(`/products/${slug}/reviews/`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] });
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
    },
  });
}
