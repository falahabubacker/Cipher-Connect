import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useMe } from '../hooks/useAuth';
import { useProfilePosts, useLikePost } from '../hooks/usePosts';
import { useSendFriendRequest, useFriends, useRemoveFriend } from '../hooks/useFriends';
import { useGetOrCreateConversation } from '../hooks/useChat';
import PostCard from '../components/PostCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserProfileScreenProps {
  route: {
    params: {
      userId: string;
    };
  };
  navigation: any;
}

export default function UserProfileScreen({ route, navigation }: UserProfileScreenProps) {
  const { userId } = route.params;
  const isFocused = useIsFocused();
  const { data: currentUser } = useMe();
  const { data: profileData, isLoading: postsLoading } = useProfilePosts(userId);
  const { data: friendsData } = useFriends(currentUser?.id || '');
  const [fullScreenImage, setFullScreenImage] = useState<{ images: any[], index: number } | null>(null);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState<Set<string>>(new Set());
  const likeMutation = useLikePost();
  const sendFriendRequestMutation = useSendFriendRequest();
  const removeFriendMutation = useRemoveFriend();
  const getOrCreateConversationMutation = useGetOrCreateConversation();

  // Update visibility when focus changes
  React.useEffect(() => {
    if (isFocused && profileData?.posts) {
      const allPostIds = new Set(profileData.posts.map((p: any) => p.id));
      setVisiblePosts(allPostIds);
    } else {
      setVisiblePosts(new Set());
    }
  }, [isFocused, profileData]);

  const handleLike = (postId: string) => {
    likeMutation.mutate(postId);
  };

  const handleFollow = () => {
    sendFriendRequestMutation.mutate(userId, {
      onSuccess: () => {
        setIsRequestPending(true);
      },
    });
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Remove Connection',
      `Are you sure you want to remove your connection with ${user?.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFriendMutation.mutate(userId);
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    getOrCreateConversationMutation.mutate(userId, {
      onSuccess: (conversation) => {
        navigation.navigate('Chat', {
          conversationId: conversation.id,
          otherUser: user,
        });
      },
    });
  };

  
  if (postsLoading || !profileData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const user = profileData.user;

  // Get friend IDs from friends data
  const friendIds = new Set(friendsData?.friends?.map((f: any) => f.id) || []);
  // Get pending request IDs from requests data (incoming)
  const pendingRequestIds = new Set(friendsData?.requests?.map((r: any) => r.created_by.id) || []);
  // Get sent request IDs (outgoing)
  const sentRequestIds = new Set(friendsData?.requests_sent?.map((r: any) => r.created_for.id) || []);
  
  const isConnected = friendIds.has(userId);
  const isPending = isRequestPending || pendingRequestIds.has(userId) || sentRequestIds.has(userId);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          {user.get_avatar ? (
            <Image
              source={{ uri: user.get_avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.posts_count}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.friends_count}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profileData?.posts?.reduce((sum: number, post: any) => sum + post.likes_count, 0) || 0}
              </Text>
              <Text style={styles.statLabel}>Investors</Text>
            </View>
            
          </View>

          {/* Connect Button */}
          {currentUser && user.id !== currentUser.id && (
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[
                  styles.followButton,
                  (isConnected || isPending) && styles.connectedButton
                ]}
                onPress={() => {
                  if (isConnected) {
                    handleDisconnect();
                  } else if (!isPending) {
                    handleFollow();
                  }
                }}
                disabled={sendFriendRequestMutation.isPending || removeFriendMutation.isPending || isPending}
              >
                <Text style={[
                  styles.followButtonText,
                  (isConnected || isPending) && styles.connectedButtonText
                ]}>
                  {isPending ? 'Pending' : isConnected ? 'Connected' : 'Connect'}
                </Text>
              </TouchableOpacity>
              
              {isConnected && (
                <TouchableOpacity 
                  style={styles.messageButton}
                  onPress={handleMessage}
                  disabled={getOrCreateConversationMutation.isPending}
                >
                  {getOrCreateConversationMutation.isPending ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Text style={styles.messageButtonText}>Message</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>

          {postsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : profileData && profileData.posts.length > 0 ? (
            <>
              {profileData.posts.map((post, index) => (
                <React.Fragment key={post.id}>
                  <View style={{marginVertical: 8 }}>
                  <PostCard
                    post={post}
                    currentUser={currentUser}
                    onLike={handleLike}
                    onCommentPress={(postId) => navigation.navigate('PostDetail', { postId })}
                    onImagePress={(images, index) => setFullScreenImage({ images, index })}
                    onUserPress={(userId) => navigation.push('UserProfile', { userId })}
                    showFollowButton={false}
                    showDeleteButton={false}
                    isLiking={likeMutation.isPending}
                    isVisible={visiblePosts.has(post.id) && isFocused}
                  />
                  {index < profileData.posts.length - 1 && (
                    <View style={styles.separator} />
                  )}
                  </View>
                </React.Fragment>
              ))}
            </>
          ) : (
            <Text style={styles.emptyText}>No posts yet</Text>
          )}
        </View>
      </ScrollView>

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
                  source={{ uri: attachment.get_url }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  messageButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  messageButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  followButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectedButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  followButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  connectedButtonText: {
    color: '#657786',
  },
  postsSection: {
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
  },
  separator: {
    height: 8,
    backgroundColor: '#F5F8FA',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
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
