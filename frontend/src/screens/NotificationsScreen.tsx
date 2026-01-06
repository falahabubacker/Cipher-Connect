import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications, useReadNotification } from '../hooks/useNotifications';
import { useHandleFriendRequest } from '../hooks/useFriends';

export default function NotificationsScreen() {
  const { data: notifications, isLoading, refetch } = useNotifications();
  const readMutation = useReadNotification();
  const handleFriendRequestMutation = useHandleFriendRequest();

  const handleRead = (notificationId: string) => {
    readMutation.mutate(notificationId);
  };

  const handleAccept = (userId: string, notificationId: string) => {
    handleFriendRequestMutation.mutate(
      { userId, status: 'accepted' },
      {
        onSuccess: () => {
          handleRead(notificationId);
        },
      }
    );
  };

  const handleReject = (userId: string, notificationId: string) => {
    handleFriendRequestMutation.mutate(
      { userId, status: 'rejected' },
      {
        onSuccess: () => {
          handleRead(notificationId);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No notifications</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
      renderItem={({ item }) => {
        console.log('Notification:', JSON.stringify(item, null, 2));
        return (
        <View style={styles.notificationItem}>
          <TouchableOpacity
            onPress={() => item.type_of_notification !== 'new_friendrequest' && handleRead(item.id)}
            disabled={item.type_of_notification === 'new_friendrequest'}
          >
            <Text style={styles.notificationBody}>{item.body}</Text>
            <Text style={styles.notificationType}>{item.type_of_notification}</Text>
          </TouchableOpacity>
          
          {item.type_of_notification === 'new_friendrequest' && item.created_by && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleAccept(item.created_by.id, item.id)}
                disabled={handleFriendRequestMutation.isPending}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleReject(item.created_by.id, item.id)}
                disabled={handleFriendRequestMutation.isPending}
              >
                <Text style={[styles.buttonText, styles.rejectButtonText]}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
    </View>
  );
}

const styles = StyleSheet.create({
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
  notificationItem: {
    backgroundColor: 'white',
    padding: 16,
  },
  notificationBody: {
    fontSize: 15,
    color: '#000',
    marginBottom: 4,
  },
  notificationType: {
    fontSize: 13,
    color: '#8E8E93',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
  },
  rejectButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  rejectButtonText: {
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});
