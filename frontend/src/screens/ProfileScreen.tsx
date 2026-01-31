import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useMe, useLogout } from '../hooks/useAuth';
import { useProfilePosts, useLikePost, useDeletePost } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import LogoutIcon from '../../assets/icons/logout_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg';
import GraphIcon from '../../assets/icons/graph_3_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const { data: currentUser, isLoading: userLoading } = useMe();
  const { data: profileData, isLoading: postsLoading } = useProfilePosts(
    currentUser?.id || ''
  );
  
  const [fullScreenImage, setFullScreenImage] = useState<{ images: any[], index: number } | null>(null);
  
  // 1. Set for tracking visible IDs
  const [visiblePosts, setVisiblePosts] = useState<Set<string>>(new Set());

  const likeMutation = useLikePost();
  const deletePostMutation = useDeletePost();
  const logoutMutation = useLogout();

  // 2. Define Viewability Configuration
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Post is 'visible' if 50% is on screen
    minimumViewTime: 200,            // Must stay for 200ms
  }).current;

  // 3. Handle visibility changes
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const newlyVisible = new Set<string>(
      viewableItems.map((item: any) => item.key.toString())
    );
    setVisiblePosts(newlyVisible);
  }).current;

  const handleLike = (postId: string) => {
    likeMutation.mutate(postId);
  };

  const handleDelete = (postId: string) => {
    deletePostMutation.mutate(postId);
  };

  // 4. Component for the top part of the profile
  const ProfileHeader = useMemo(() => {
    if (!currentUser) return null;
    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.graphButton}
          onPress={() => navigation.navigate('Graph')}
        >
          <GraphIcon width={24} height={24} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <LogoutIcon width={24} height={24} color="#e81717b1" />
          )}
        </TouchableOpacity>

        {currentUser.get_avatar ? (
          <Image source={{ uri: currentUser.get_avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        
        <Text style={styles.name}>{currentUser.name}</Text>
        <Text style={styles.email}>{currentUser.email}</Text>

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

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>My Posts</Text>
        {postsLoading && <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />}
      </View>
    );
  }, [currentUser, profileData, postsLoading, logoutMutation.isPending]);

  if (userLoading || !currentUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={profileData?.posts || []}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={ProfileHeader}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={true} // Performance boost
        renderItem={({ item }) => (
          <View style={styles.postWrapper}>
            <PostCard
              post={item}
              currentUser={currentUser}
              onLike={handleLike}
              onDelete={handleDelete}
              onCommentPress={(postId) => navigation.navigate('PostDetail', { postId })}
              onImagePress={(images, index) => setFullScreenImage({ images, index })}
              onUserPress={(userId) => navigation.navigate('UserProfile', { userId })}
              showDeleteButton={true}
              isLiking={likeMutation.isPending}
              // Active only if it is the focused screen AND it's physically in the viewport
              isVisible={isFocused && visiblePosts.has(item.id.toString())}
            />
            <View style={styles.separator} />
          </View>
        )}
        ListEmptyComponent={
          !postsLoading ? <Text style={styles.emptyText}>No posts yet</Text> : null
        }
      />

      {/* Full Screen Image Modal remains unchanged */}
      <Modal
        visible={!!fullScreenImage}
        transparent={true}
        onRequestClose={() => setFullScreenImage(null)}
        animationType="fade"
      >
        <View style={styles.fullScreenContainer}>
          <StatusBar hidden />
          <TouchableOpacity style={styles.closeButton} onPress={() => setFullScreenImage(null)}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          {fullScreenImage && (
            <FlatList
              data={fullScreenImage.images}
              horizontal
              pagingEnabled
              initialScrollIndex={fullScreenImage.index}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.get_url }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (Your existing styles remain mostly the same)
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  graphButton: { position: 'absolute', top: 16, left: 16, zIndex: 2, padding: 6 },
  logoutButton: { position: 'absolute', top: 16, right: 16, zIndex: 2, padding: 6 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#007AFF' },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: 'white' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  email: { fontSize: 14, color: '#8E8E93', marginBottom: 20 },
  stats: { flexDirection: 'row', gap: 40, marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 14, color: '#8E8E93' },
  buttonRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 10 },
  editButton: { flex: 1, backgroundColor: '#007AFF', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  editButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start', marginTop: 10 },
  postWrapper: { backgroundColor: 'white' },
  separator: { height: 8, backgroundColor: '#ffffff' },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginTop: 40 },
  fullScreenContainer: { flex: 1, backgroundColor: 'black' },
  fullScreenImage: { width: SCREEN_WIDTH, height: '100%' },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 5, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { color: 'white', fontSize: 24 },
});