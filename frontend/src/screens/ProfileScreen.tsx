import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useMe } from '../hooks/useAuth';
import { useProfilePosts, useLikePost, useDeletePost } from '../hooks/usePosts';
import PostCard from '../components/PostCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const { data: currentUser, isLoading: userLoading } = useMe();
  const { data: profileData, isLoading: postsLoading } = useProfilePosts(
    currentUser?.id || ''
  );
  const [fullScreenImage, setFullScreenImage] = useState<{ images: any[], index: number } | null>(null);
  const [visiblePosts, setVisiblePosts] = useState<Set<string>>(new Set());
  const likeMutation = useLikePost();
  const deletePostMutation = useDeletePost();

  // Track which posts are in viewport
  const handleScroll = React.useCallback((event: any) => {
    // Since we're using ScrollView, we'll consider all posts visible when screen is focused
    // For better performance, you could implement intersection observer logic here
    if (isFocused && profileData?.posts) {
      const allPostIds = new Set(profileData.posts.map((p: any) => p.id));
      setVisiblePosts(allPostIds);
    }
  }, [isFocused, profileData]);

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

  const handleDelete = (postId: string) => {
    deletePostMutation.mutate(postId);
  };

  if (userLoading || !currentUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          {currentUser.get_avatar ? (
            <Image
              source={{ uri: currentUser.get_avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.email}>{currentUser.email}</Text>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.posts_count}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.friends_count}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profileData?.posts?.reduce((sum: number, post: any) => sum + post.likes_count, 0) || 0}
              </Text>
              <Text style={styles.statLabel}>Invests</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>My Posts</Text>

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
                    onDelete={handleDelete}
                    onCommentPress={(postId) => navigation.navigate('PostDetail', { postId })}
                    onImagePress={(images, index) => setFullScreenImage({ images, index })}
                    onUserPress={(userId) => navigation.navigate('UserProfile', { userId })}
                    showDeleteButton={true}
                    isLiking={likeMutation.isPending}
                    isVisible={visiblePosts.has(post.id) && isFocused}
                  />
                  </View>
                  {index < profileData.posts.length - 1 && (
                    <View style={styles.separator} />
                  )}
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
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
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
    color: '#8E8E93',
    marginBottom: 20,
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
    color: '#8E8E93',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
  postCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
