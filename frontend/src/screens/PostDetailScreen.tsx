import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { usePost, useLikePost, useCommentPost } from '../hooks/usePosts';
import { useSendFriendRequest, useFriends, useRemoveFriend } from '../hooks/useFriends';
import { useMe } from '../hooks/useAuth';
import PostCard from '../components/PostCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostDetailScreenProps {
  route: {
    params: {
      postId: string;
    };
  };
  navigation: any;
}

export default function PostDetailScreen({ route, navigation }: PostDetailScreenProps) {
  const { postId } = route.params;
  const [commentText, setCommentText] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState<{ images: any[], index: number } | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  const { data: post, isLoading, error } = usePost(postId);
  const likeMutation = useLikePost();
  const commentMutation = useCommentPost();
  const sendFriendRequestMutation = useSendFriendRequest();
  const removeFriendMutation = useRemoveFriend();
  const { data: currentUser } = useMe();
  const { data: friendsData } = useFriends(currentUser?.id || '');

  const handleLike = () => {
    likeMutation.mutate(postId);
  };

  const handleFollow = (userId: string) => {
    sendFriendRequestMutation.mutate(userId, {
      onSuccess: () => {
        setPendingRequests(prev => new Set(prev).add(userId));
      },
    });
  };

  const handleDisconnect = (userId: string) => {
    removeFriendMutation.mutate(userId);
  };

  // Get friend IDs from friends data
  const friendIds = new Set(friendsData?.friends?.map((f: any) => f.id) || []);
  // Get pending request IDs from requests data  
  const pendingRequestIds = new Set(friendsData?.requests?.map((r: any) => r.created_by.id) || []);

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      commentMutation.mutate(
        { postId, body: commentText },
        {
          onSuccess: () => {
            setCommentText('');
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Unable to load post</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView}>
        {/* Post Card */}
        <PostCard
          post={post}
          currentUser={currentUser}
          onLike={handleLike}
          onFollow={handleFollow}
          onDisconnect={handleDisconnect}
          onCommentPress={() => {}}
          onImagePress={(images, index) => setFullScreenImage({ images, index })}
          onUserPress={(userId) => navigation.navigate('UserProfile', { userId })}
          showFollowButton={true}
          showDeleteButton={false}
          isLiking={likeMutation.isPending}
          isFollowing={sendFriendRequestMutation.isPending}
          isFollowingUser={friendIds.has(post.created_by.id)}
          isRequestPending={pendingRequests.has(post.created_by.id) || pendingRequestIds.has(post.created_by.id)}
          isDisconnecting={removeFriendMutation.isPending}
        />

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>

          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Image
                  source={{ uri: comment.created_by.get_avatar }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {comment.created_by.name}
                    </Text>
                    <Text style={styles.commentTime}>
                      {comment.created_at_formatted}
                    </Text>
                  </View>
                  <Text style={styles.commentBody}>{comment.body}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          editable={!commentMutation.isPending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || commentMutation.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || commentMutation.isPending}
        >
          {commentMutation.isPending ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!fullScreenImage}
        transparent={true}
        onRequestClose={() => setFullScreenImage(null)}
        animationType="fade"
      >
        <View style={styles.fullScreenContainer}>
          <StatusBar hidden />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullScreenImage(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          {fullScreenImage && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: fullScreenImage.index * SCREEN_WIDTH, y: 0 }}
            >
              {fullScreenImage.images.map((attachment) => (
                <Image
                  key={attachment.id}
                  source={{ uri: attachment.get_image }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  postCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e0e0',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  commentsSection: {
    backgroundColor: 'white',
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  commentBody: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  noComments: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
