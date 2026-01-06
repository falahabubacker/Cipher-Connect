import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { chatApi } from '../api/endpoints';
import { Conversation, ConversationMessage } from '../types/api';

export const useConversations = (options?: Omit<UseQueryOptions<Conversation[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await chatApi.conversations();
      return data;
    },
    ...options,
  });
};

export const useConversation = (id: string, options?: Omit<UseQueryOptions<Conversation>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const { data } = await chatApi.conversation(id);
      return data;
    },
    enabled: !!id,
    ...options,
  });
};

export const useGetOrCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await chatApi.getOrCreate(userId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      const { data } = await chatApi.sendMessage(conversationId, body);
      return data;
    },
    onSuccess: (_, { conversationId }) => {
      // Invalidate conversation to show new message
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
