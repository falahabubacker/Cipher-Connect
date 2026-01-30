import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { friendsApi } from '../api/endpoints';
import { Connections } from '../types/api';

export const useConnections = (options?: Omit<UseQueryOptions<Connections>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data } = await friendsApi.connections();
      return data;
    },
    ...options,
  });
};
