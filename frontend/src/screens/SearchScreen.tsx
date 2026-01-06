import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSearch } from '../hooks/useSearch';
import { useSendFriendRequest, useFriends, useRemoveFriend } from '../hooks/useFriends';
import { useMe } from '../hooks/useAuth';

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const searchMutation = useSearch();
  const sendFriendRequestMutation = useSendFriendRequest();
  const removeFriendMutation = useRemoveFriend();
  const { data: currentUser } = useMe();
  const { data: friendsData } = useFriends(currentUser?.id || '');

  const handleSearch = () => {
    if (query.trim()) {
      searchMutation.mutate(query);
    }
  };

  const handleFollow = (userId: string) => {
    sendFriendRequestMutation.mutate(userId, {
      onSuccess: () => {
        setPendingRequests(prev => new Set(prev).add(userId));
      },
    });
  };

  const handleDisconnect = (userId: string, userName: string) => {
    Alert.alert(
      'Remove Connection',
      `Are you sure you want to remove your connection with ${userName}?`,
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

  // Get friend IDs from friends data
  const friendIds = new Set(friendsData?.friends?.map((f: any) => f.id) || []);
  // Get pending request IDs from requests data
  const pendingRequestIds = new Set(friendsData?.requests?.map((r: any) => r.created_by.id) || []);

  return (
    <View style={styles.container}>      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search users or posts..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {searchMutation.isPending && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {searchMutation.data && (
        <View style={styles.results}>
          {/* Users */}
          {searchMutation.data.users.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Users</Text>
              {searchMutation.data.users.map((user) => {
                const isRequestPending = pendingRequests.has(user.id) || pendingRequestIds.has(user.id);
                const isFollowingUser = friendIds.has(user.id);
                return (
                <TouchableOpacity 
                  key={user.id} 
                  style={styles.userItem}
                  onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
                >
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
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  {currentUser && user.id !== currentUser.id && (
                    <TouchableOpacity
                      style={[
                        styles.followButton,
                        (isFollowingUser || isRequestPending) && styles.followingButton
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (isFollowingUser) {
                          handleDisconnect(user.id, user.name);
                        } else if (!isRequestPending) {
                          handleFollow(user.id);
                        }
                      }}
                      disabled={sendFriendRequestMutation.isPending || removeFriendMutation.isPending || isRequestPending}
                    >
                      <Text style={[
                        styles.followButtonText,
                        (isFollowingUser || isRequestPending) && styles.followingButtonText
                      ]}>
                        {isRequestPending ? 'Pending' : isFollowingUser ? 'Connected' : 'Connect'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Posts */}
          {searchMutation.data.posts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Posts</Text>
              {searchMutation.data.posts.map((post) => (
                <View key={post.id} style={styles.postItem}>
                  <Text style={styles.postAuthor}>{post.created_by.name}</Text>
                  <Text style={styles.postBody} numberOfLines={2}>
                    {post.body}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {searchMutation.data.users.length === 0 &&
            searchMutation.data.posts.length === 0 && (
              <Text style={styles.emptyText}>No results found</Text>
            )}
        </View>
      )}

      {!searchMutation.data && !searchMutation.isPending && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>🔍 Search for users and posts</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2332',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1A2332',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  results: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E1E8ED',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  followingButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: '#657786',
  },
  postItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  postBody: {
    fontSize: 15,
    color: '#000',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
