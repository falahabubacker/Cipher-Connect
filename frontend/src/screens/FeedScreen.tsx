import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { usePosts, useLikePost } from '../hooks/usePosts';
import { useSendFriendRequest, useFriends, useRemoveFriend } from '../hooks/useFriends';
import { useMe } from '../hooks/useAuth';
import PostCard from '../components/PostCard';
import LightBulbIcon from '../components/icons/LightBulbIcon';
import NotificationIcon from '../components/icons/NotificationIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FeedScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const { data: posts, isLoading, error, refetch } = usePosts();
  const likeMutation = useLikePost();
  const sendFriendRequestMutation = useSendFriendRequest();
  const removeFriendMutation = useRemoveFriend();
  const { data: currentUser } = useMe();
  const { data: friendsData, refetch: refetchFriends } = useFriends(currentUser?.id || '');
  const [fullScreenImage, setFullScreenImage] = useState<{ images: any[], index: number } | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [visiblePosts, setVisiblePosts] = useState<Set<string>>(new Set());

  const handleViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    const visibleIds = new Set(viewableItems.map((item: any) => item.item.id));
    setVisiblePosts(visibleIds);
  });

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50, // Post is considered visible when 50% is on screen
  });

  const handleLike = (postId: string) => {
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

  const handleRefresh = () => {
    refetch();
    refetchFriends();
  };

  // Get friend IDs from friends data
  const friendIds = new Set(friendsData?.friends?.map((f: any) => f.id) || []);
  // Get pending request IDs from requests data
  const pendingRequestIds = new Set(friendsData?.requests?.map((r: any) => r.created_by.id) || []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F4C430" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Unable to load posts</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>Start following friends to see their posts!</Text>
        <TouchableOpacity 
          style={styles.createPostButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.createPostText}>Create Your First Post</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <NotificationIcon size={28} color="#E3E3E3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CIPHER</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          {currentUser?.get_avatar ? (
            <Image 
              source={{ uri: currentUser.get_avatar }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {currentUser?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={handleRefresh}
            tintColor="#F4C430"
          />
        }
        onViewableItemsChanged={handleViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item: post }) => {
          const userId = post.created_by.id;
          const isRequestPending = pendingRequests.has(userId) || pendingRequestIds.has(userId);
          const isFollowingUser = friendIds.has(userId);
          const isPostVisible = visiblePosts.has(post.id) && isFocused;
          
          return (
            <PostCard
              post={post}
              currentUser={currentUser}
              onLike={handleLike}
              onFollow={handleFollow}
              onDisconnect={handleDisconnect}
              onCommentPress={(postId) => navigation.navigate('PostDetail', { postId })}
              onImagePress={(images, index) => setFullScreenImage({ images, index })}
              onBodyPress={(postId) => navigation.navigate('PostDetail', { postId })}
              onUserPress={(userId) => navigation.navigate('UserProfile', { userId })}
              showFollowButton={true}
              isLiking={likeMutation.isPending}
              isFollowing={sendFriendRequestMutation.isPending}
              isFollowingUser={isFollowingUser}
              isRequestPending={isRequestPending}
              isDisconnecting={removeFriendMutation.isPending}
              isVisible={isPostVisible}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      {/* Floating Action Button with Bulb */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <LightBulbIcon size={32} color="#1A2332" />
      </TouchableOpacity>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2332',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#1A2332',
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  headerAvatarText: {
    color: '#1A2332',
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedContent: {
    paddingVertical: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A2332',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E3E3E3',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#1A2332',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E3E3E3',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  createPostButton: {
    marginTop: 20,
    backgroundColor: '#F4C430',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostText: {
    color: '#1A2332',
    fontWeight: 'bold',
    fontSize: 16,
  },
  separator: {
    height: 16,
    backgroundColor: 'transparent',
  },
  fab: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
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
