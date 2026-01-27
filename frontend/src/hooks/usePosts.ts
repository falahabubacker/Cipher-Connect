import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { postsApi } from '../api/endpoints';
import { Post, PostDetail } from '../types/api';

export const usePosts = (trend?: string, options?: Omit<UseQueryOptions<Post[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['posts', trend],
    queryFn: async () => {
      const { data } = await postsApi.list(trend);
      return data;
    },
    ...options,
  });
};

export const usePost = (id: string, options?: Omit<UseQueryOptions<PostDetail>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await postsApi.detail(id);
      return data.post;
    },
    enabled: !!id,
    ...options,
  });
};

export const useProfilePosts = (userId: string) => {
  return useQuery({
    queryKey: ['posts', 'profile', userId],
    queryFn: async () => {
      const { data } = await postsApi.profile(userId);
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await postsApi.create(formData);
      return data;
    },
    onSuccess: () => {
      // Invalidate posts list to refetch with new post
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Mutation for requesting a presigned upload URL
export const usePresignedUrl = () => {
  
  return useMutation({
    mutationFn: async ({filename, content_type}: {filename: string, content_type: string}) => {
      const { data } = await postsApi.getPresignedUrl({ filename, content_type });
      return data;
    },
  });
}

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await postsApi.like(postId);
      return data;
    },
    onSuccess: (_, postId) => {
      // Invalidate specific post and posts list
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useCommentPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, body }: { postId: string; body: string }) => {
      const { data } = await postsApi.comment(postId, body);
      return data;
    },
    onSuccess: (_, { postId }) => {
      // Invalidate specific post to show new comment
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      // Invalidate posts list to update comment count in feed
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await postsApi.delete(postId);
      return data;
    },
    onSuccess: () => {
      // Invalidate posts list
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useReportPost = () => {
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await postsApi.report(postId);
      return data;
    },
  });
};
