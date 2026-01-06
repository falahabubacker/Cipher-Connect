import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConversations } from '../hooks/useChat';
import { useMe } from '../hooks/useAuth';

export default function ChatListScreen({ navigation }: any) {
  const { data: conversations, isLoading } = useConversations();
  const { data: currentUser } = useMe();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No conversations yet</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1A2332' }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item: conversation }) => {
        // Get the other user (not current user)
        const otherUser = conversation.users.find(
          (user: any) => user.id !== currentUser?.id
        ) || conversation.users[0];
        
        // Get the last message if available
        const lastMessage = conversation.messages && conversation.messages.length > 0
          ? conversation.messages[conversation.messages.length - 1]
          : null;
        
        return (
          <TouchableOpacity 
            style={styles.conversationItem}
            onPress={() => navigation.navigate('Chat', { 
              conversationId: conversation.id,
              otherUser 
            })}
          >
            {otherUser?.get_avatar ? (
              <Image
                source={{ uri: otherUser.get_avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.conversationInfo}>
              <View style={styles.headerRow}>
                <Text style={styles.userName}>{otherUser?.name || 'User'}</Text>
                <Text style={styles.timestamp}>{conversation.modified_at_formatted}</Text>
              </View>
              {lastMessage && (
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {lastMessage.created_by.id === currentUser?.id ? 'You: ' : ''}
                  {lastMessage.body}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
    </View>
  );
}

const styles = StyleSheet.create({
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
  center: {
    backgroundColor: '#1A2332',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
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
  conversationInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});
