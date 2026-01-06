import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { notificationsApi } from '../api/endpoints';
import { Notification } from '../types/api';

export const useNotifications = (options?: Omit<UseQueryOptions<Notification[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await notificationsApi.list();
      return data;
    },
    // Refetch notifications every 30 seconds
    refetchInterval: 30000,
    ...options,
  });
};

export const useReadNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await notificationsApi.read(notificationId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
