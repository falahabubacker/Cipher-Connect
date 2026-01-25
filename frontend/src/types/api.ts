// TypeScript types matching Django REST Framework serializers

export interface User {
  id: string;
  name: string;
  email: string;
  friends_count: number;
  posts_count: number;
  get_avatar: string;
}

export interface FriendshipRequest {
  id: string;
  created_by: User;
}

export interface PostAttachment {
  id: string;
  get_image: string;
  content_type?: string;
  is_video?: boolean;
}

export interface Post {
  id: string;
  body: string;
  is_private: boolean;
  likes_count: number;
  comments_count: number;
  created_by: User;
  created_at_formatted: string;
  attachments?: PostAttachment[];
}

export interface Comment {
  id: string;
  body: string;
  created_by: User;
  created_at_formatted: string;
}

export interface PostDetail extends Post {
  comments: Comment[];
}

export interface ConversationMessage {
  id: string;
  sent_to: User;
  created_by: User;
  created_at_formatted: string;
  body: string;
}

export interface Conversation {
  id: string;
  users: User[];
  modified_at_formatted: string;
  messages?: ConversationMessage[];
}

export interface Notification {
  id: string;
  body: string;
  type_of_notification: string;
  post_id?: string;
  created_for_id: string;
}

export interface Trend {
  id: string;
  hashtag: string;
  occurences: number;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface SignupRequest {
  email: string;
  name: string;
  password1: string;
  password2: string;
}

export interface SignupResponse {
  message: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

export interface FriendsResponse {
  user: User;
  friends: User[];
  requests: FriendshipRequest[];
  requests_sent: FriendshipRequest[];
}

export interface ProfilePostsResponse {
  posts: Post[];
  user: User;
  can_send_friendship_request: boolean;
}

export interface SearchResponse {
  users: User[];
  posts: Post[];
}

export interface MessageResponse {
  message: string;
}

export interface PostDetailResponse {
  post: PostDetail;
}
