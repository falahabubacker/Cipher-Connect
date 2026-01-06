import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLogin, useMe } from '../hooks/useAuth';
import { usePosts, useCreatePost } from '../hooks/usePosts';
import { useTrends } from '../hooks/useSearch';

export default function TestScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [postBody, setPostBody] = useState('');

  // Test auth hooks
  const loginMutation = useLogin();
  const { data: currentUser, isLoading: userLoading, error: userError } = useMe();

  // Test posts hooks
  const { data: posts, isLoading: postsLoading, error: postsError } = usePosts();
  const createPostMutation = useCreatePost();

  // Test trends hook
  const { data: trends, isLoading: trendsLoading } = useTrends();

  const handleLogin = () => {
    if (email && password) {
      loginMutation.mutate({ email, password });
    }
  };

  const handleCreatePost = () => {
    if (postBody) {
      const formData = new FormData();
      formData.append('body', postBody);
      createPostMutation.mutate(formData);
      setPostBody('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Test Screen</Text>

      {/* Login Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Login Test</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title={loginMutation.isPending ? 'Logging in...' : 'Login'}
          onPress={handleLogin}
          disabled={loginMutation.isPending}
        />
        {loginMutation.isError && (
          <Text style={styles.error}>
            Login Error: {loginMutation.error?.message}
          </Text>
        )}
        {loginMutation.isSuccess && (
          <Text style={styles.success}>✓ Login successful!</Text>
        )}
      </View>

      {/* Current User Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Current User (useMe hook)</Text>
        {userLoading && <ActivityIndicator />}
        {userError && (
          <Text style={styles.error}>
            Not logged in or error: {userError?.message}
          </Text>
        )}
        {currentUser && (
          <View style={styles.card}>
            <Text>ID: {currentUser.id}</Text>
            <Text>Name: {currentUser.name}</Text>
            <Text>Email: {currentUser.email}</Text>
            <Text>Friends: {currentUser.friends_count}</Text>
            <Text>Posts: {currentUser.posts_count}</Text>
          </View>
        )}
      </View>

      {/* Posts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Posts (usePosts hook)</Text>
        {postsLoading && <ActivityIndicator />}
        {postsError && (
          <Text style={styles.error}>Posts Error: {postsError?.message}</Text>
        )}
        {posts && (
          <View>
            <Text style={styles.info}>Found {posts.length} posts</Text>
            {posts.slice(0, 3).map((post) => (
              <View key={post.id} style={styles.card}>
                <Text style={styles.postAuthor}>{post.created_by.name}</Text>
                <Text numberOfLines={2}>{post.body}</Text>
                <Text style={styles.postStats}>
                  ❤️ {post.likes_count} | 💬 {post.comments_count}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Create Post Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✍️ Create Post</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What's on your mind?"
          value={postBody}
          onChangeText={setPostBody}
          multiline
          numberOfLines={3}
        />
        <Button
          title={createPostMutation.isPending ? 'Posting...' : 'Create Post'}
          onPress={handleCreatePost}
          disabled={createPostMutation.isPending || !currentUser}
        />
        {createPostMutation.isError && (
          <Text style={styles.error}>
            Error: {createPostMutation.error?.message}
          </Text>
        )}
        {createPostMutation.isSuccess && (
          <Text style={styles.success}>✓ Post created!</Text>
        )}
      </View>

      {/* Trends Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Trends (useTrends hook)</Text>
        {trendsLoading && <ActivityIndicator />}
        {trends && (
          <View>
            <Text style={styles.info}>Found {trends.length} trends</Text>
            {trends.slice(0, 5).map((trend) => (
              <View key={trend.id} style={styles.trendCard}>
                <Text style={styles.hashtag}>#{trend.hashtag}</Text>
                <Text style={styles.occurences}>{trend.occurences} posts</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✓ All hooks are connected to the backend
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  postAuthor: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  postStats: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  trendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 5,
  },
  hashtag: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  occurences: {
    fontSize: 12,
    color: '#666',
  },
  error: {
    color: 'red',
    marginTop: 5,
    fontSize: 12,
  },
  success: {
    color: 'green',
    marginTop: 5,
    fontWeight: 'bold',
  },
  info: {
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontStyle: 'italic',
  },
});
