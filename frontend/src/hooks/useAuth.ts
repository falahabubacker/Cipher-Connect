import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { authApi } from '../api/endpoints';
import { setAccessToken, setRefreshToken, clearTokens } from '../api/client';
import { useAuthContext } from '../contexts/AuthContext';
import { User, LoginRequest, SignupRequest } from '../types/api';

export const useMe = (options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const { data } = await authApi.me();
      return data;
    },
    ...options,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login } = useAuthContext();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await authApi.login(credentials);
      return data;
    },
    onSuccess: async (data) => {
      // Store tokens
      setAccessToken(data.access);
      await setRefreshToken(data.refresh);
      
      // Update auth context
      login(data.access);
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: async (data: SignupRequest) => {
      const response = await authApi.signup(data);
      return response.data;
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuthContext();

  return useMutation({
    mutationFn: async () => {
      await clearTokens();
    },
    onSuccess: () => {
      // Update auth context
      logout();
      
      // Clear all cached data
      queryClient.clear();
    },
  });
};

export const useEditProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await authApi.editProfile(formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
};

export const useEditPassword = () => {
  return useMutation({
    mutationFn: async (data: { old_password: string; new_password1: string; new_password2: string }) => {
      const response = await authApi.editPassword(data);
      return response.data;
    },
  });
};
