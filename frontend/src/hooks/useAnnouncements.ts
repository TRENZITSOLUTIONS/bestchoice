import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Announcement {
  id: number;
  text: string;
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => (await api.get<{ results: Announcement[] }>('/announcements/')).data.results,
    staleTime: 5 * 60 * 1000, // rarely changes; no need to refetch on every mount
  });
}
