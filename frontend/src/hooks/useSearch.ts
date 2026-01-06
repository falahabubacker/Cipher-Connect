import { useMutation } from '@tanstack/react-query';
import { searchApi, trendsApi } from '../api/endpoints';
import { SearchResponse, Trend } from '../types/api';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export const useSearch = () => {
  return useMutation({
    mutationFn: async (query: string) => {
      const { data } = await searchApi.search(query);
      return data;
    },
  });
};

export const useTrends = (options?: Omit<UseQueryOptions<Trend[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['trends'],
    queryFn: async () => {
      const { data } = await trendsApi.list();
      return data;
    },
    // Refetch trends every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    ...options,
  });
};
