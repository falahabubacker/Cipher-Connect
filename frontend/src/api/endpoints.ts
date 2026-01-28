import api from './client';
import {
  User,
  Post,
  PresignedUrlResponse,
  PostDetail,
  Comment,
  Conversation,
  ConversationMessage,
  Notification,
  Trend,
  FriendshipRequest,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  FriendsResponse,
  ProfilePostsResponse,
  SearchResponse,
  MessageResponse,
  PostDetailResponse,
} from '../types/api';

// Auth endpoints
export const authApi = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>('/api/login/', credentials),

  refresh: (data: RefreshTokenRequest) =>
    api.post<RefreshTokenResponse>('/api/refresh/', data),

  me: () =>
    api.get<User>('/api/me/'),

  signup: (data: SignupRequest) =>
    api.post<SignupResponse>('/api/signup/', data),

  editProfile: (data: FormData) =>
    api.post<{ message: string; user: User }>('/api/editprofile/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  editPassword: (data: { old_password: string; new_password1: string; new_password2: string }) =>
    api.post<MessageResponse>('/api/editpassword/', data),
};

// Posts endpoints
export const postsApi = {
  list: (trend?: string) =>
    api.get<Post[]>('/api/posts/', { params: trend ? { trend } : {} }),

  detail: (id: string) =>
    api.get<PostDetailResponse>(`/api/posts/${id}/`),

  profile: (userId: string) =>
    api.get<ProfilePostsResponse>(`/api/posts/profile/${userId}/`),

  create: (data: FormData) =>
    api.post<Post>('/api/posts/create/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getPresignedUrl: ({ filename, content_type }: { filename: string; content_type: string }) =>
    api.post<PresignedUrlResponse>(`/api/posts/presign/`, { filename, content_type }),

  like: (id: string) =>
    api.post<MessageResponse>(`/api/posts/${id}/like/`),

  comment: (id: string, body: string) =>
    api.post<Comment>(`/api/posts/${id}/comment/`, { body }),

  delete: (id: string) =>
    api.delete<MessageResponse>(`/api/posts/${id}/delete/`),

  report: (id: string) =>
    api.post<MessageResponse>(`/api/posts/${id}/report/`),
};

// Friends endpoints
export const friendsApi = {
  list: (userId: string) =>
    api.get<FriendsResponse>(`/api/friends/${userId}/`),

  suggestions: () =>
    api.get<User[]>('/api/friends/suggested/'),

  sendRequest: (userId: string) =>
    api.post<MessageResponse>(`/api/friends/${userId}/request/`),

  handleRequest: (userId: string, status: 'accepted' | 'rejected') =>
    api.post<MessageResponse>(`/api/friends/${userId}/${status}/`),

  removeFriend: (userId: string) =>
    api.post<MessageResponse>(`/api/friends/${userId}/remove/`),
};

// Chat endpoints
export const chatApi = {
  conversations: () =>
    api.get<Conversation[]>('/api/chat/'),

  conversation: (id: string) =>
    api.get<Conversation>(`/api/chat/${id}/`),

  getOrCreate: (userId: string) =>
    api.get<Conversation>(`/api/chat/${userId}/get-or-create/`),

  sendMessage: (conversationId: string, body: string) =>
    api.post<ConversationMessage>(`/api/chat/${conversationId}/send/`, { body }),
};

// Notifications endpoints
export const notificationsApi = {
  list: () =>
    api.get<Notification[]>('/api/notifications/'),

  read: (id: string) =>
    api.post<MessageResponse>(`/api/notifications/read/${id}/`),
};

// Search endpoint
export const searchApi = {
  search: (query: string) =>
    api.post<SearchResponse>('/api/search/', { query }),
};

// Trends endpoint
export const trendsApi = {
  list: () =>
    api.get<Trend[]>('/api/trends/'),
};
