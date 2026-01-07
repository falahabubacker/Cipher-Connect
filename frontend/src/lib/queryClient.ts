import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(3000 * 2 ** attemptIndex, 60000),
      staleTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      // Cancel queries on unmount to prevent broken pipe
      networkMode: 'online',
    },
    mutations: {
      retry: 2,
      retryDelay: 3000,
      networkMode: 'online',
    },
  },
});
