import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { friendsApi } from '../api/endpoints';
import { User, FriendsResponse } from '../types/api';

export const useFriends = (userId: string, options?: Omit<UseQueryOptions<FriendsResponse>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      const { data } = await friendsApi.list(userId);
      return data;
    },
    enabled: !!userId,
    ...options,
  });
};

export const useFriendSuggestions = (options?: Omit<UseQueryOptions<User[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['friends', 'suggestions'],
    queryFn: async () => {
      const { data } = await friendsApi.suggestions();
      return data;
    },
    ...options,
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await friendsApi.sendRequest(userId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'profile'] });
    },
  });
};

export const useHandleFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'accepted' | 'rejected' }) => {
      const { data } = await friendsApi.handleRequest(userId, status);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await friendsApi.removeFriend(userId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'profile'] });
    },
  });
};
