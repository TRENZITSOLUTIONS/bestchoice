import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { User } from '@/lib/types';

export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get<User>('/auth/me/');
      return res.data;
    },
    enabled: isAuthenticated,
  });
}

export function useStaffLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await api.post('/auth/staff/login/', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access, data.refresh);
      queryClient.invalidateQueries();
    },
  });
}

export function useGoogleLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { credential: string; referral_code?: string }) => {
      const res = await api.post('/auth/google/', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access, data.refresh);
      queryClient.invalidateQueries();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Pick<User, 'first_name' | 'last_name' | 'phone'>>) => {
      const res = await api.put('/auth/me/', payload);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  return () => {
    logout();
    queryClient.clear();
  };
}
