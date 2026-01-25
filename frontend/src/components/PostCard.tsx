import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import VideoPlayer from './VideoPlayer';
import FinanceIcon from '../../assets/icons/finance_mode_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg';
import ChatBubbleIcon from '../../assets/icons/chat_bubble_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg';
import HandshakeIcon from '../../assets/icons/handshake_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg';
import PlayCircleIcon from '../../assets/icons/play_circle_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: any;
  currentUser: any;
  onLike: (postId: string) => void;
  onFollow?: (userId: string) => void;
  onDisconnect?: (userId: string) => void;
  onDelete?: (postId: string) => void;
  onCommentPress: (postId: string) => void;
  onImagePress: (images: any[], index: number) => void;
  onBodyPress?: (postId: string) => void;
  onUserPress?: (userId: string) => void;
  onHandshake?: (userId: string) => void;
  showFollowButton?: boolean;
  showDeleteButton?: boolean;
  isLiking?: boolean;
  isFollowing?: boolean;
  isFollowingUser?: boolean;
  isRequestPending?: boolean;
  isDisconnecting?: boolean;
  isVisible?: boolean;
}

export default function PostCard({
  post,
  currentUser,
  onLike,
  onFollow,
  onDisconnect,
  onDelete,
  onCommentPress,
  onImagePress,
  onBodyPress,
  onUserPress,
  onHandshake,
  showFollowButton = false,
  showDeleteButton = false,
  isLiking = false,
  isFollowing = false,
  isFollowingUser = false,
  isRequestPending = false,
  isDisconnecting = false,
  isVisible = true,
}: PostCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleDeletePress = () => {
    if (onDelete) {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setMenuVisible(false),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onDelete(post.id);
              setMenuVisible(false);
            },
          },
        ]
      );
    }
  };

  const handleDisconnectPress = () => {
    if (onDisconnect) {
      Alert.alert(
        'Remove Connection',
        `Are you sure you want to remove your connection with ${post.created_by.name}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              onDisconnect(post.created_by.id);
            },
          },
        ]
      );
    }
  };

  const bodyContent = (
    <Text style={styles.body}>{post.body}</Text>
  );

  return (
    <View style={styles.postCard}>
      {/* User Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onUserPress && onUserPress(post.created_by.id)}
          disabled={!onUserPress}
        >
          <Image
            source={{ uri: post.created_by.get_avatar }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onUserPress && onUserPress(post.created_by.id)}
          disabled={!onUserPress}
        >
          <Text style={styles.username}>{post.created_by.name}</Text>
          <Text style={styles.timestamp}>{post.created_at_formatted}</Text>
        </TouchableOpacity>
        
        {/* Connect Button */}
        {/* {showFollowButton && currentUser && post.created_by.id !== currentUser.id && onFollow && (
          <TouchableOpacity
            style={[
              styles.followButton,
              (isFollowingUser || isRequestPending) && styles.followingButton
            ]}
            onPress={() => {
              if (isFollowingUser && onDisconnect) {
                handleDisconnectPress();
              } else if (!isRequestPending) {
                onFollow(post.created_by.id);
              }
            }}
            disabled={isFollowing || isRequestPending || isDisconnecting}
          >
            <Text style={[
              styles.followButtonText,
              (isFollowingUser || isRequestPending) && styles.followingButtonText
            ]}>
              {isRequestPending ? 'Pending' : isFollowingUser ? 'Connected' : 'Connect'}
            </Text>
          </TouchableOpacity>
        )} */}

        {/* Delete Menu Button */}
        {showDeleteButton && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(!menuVisible)}
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Delete Menu */}
      {menuVisible && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDeletePress}
          >
            <Text style={styles.menuItemTextDelete}>Delete Post</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Post Images/Videos Carousel */}
      {post.attachments && post.attachments.length > 0 && (
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const slideIndex = Math.round(
                event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
              );
              setActiveSlide(slideIndex);
            }}
          >
            {post.attachments.map((attachment: any, index: number) => {
              // Use is_video from backend if available, otherwise check extension
              const isVideo = attachment.is_video ?? (
                attachment.get_image?.match(/\.(mp4|mov|avi|m4v|webm|mkv)$/i) !== null
              );
              
              // Video should play only if it's the active slide
              const isActiveSlide = activeSlide === index;
              // Only render video player if post is visible - prevents loading videos off-screen
              const shouldRenderVideo = isVideo && isVisible;
              
              return (
                <TouchableOpacity
                  key={attachment.id}
                  onPress={() => !isVideo && onImagePress(post.attachments, index)}
                  activeOpacity={isVideo ? 1 : 0.9}
                  disabled={isVideo}
                >
                  {shouldRenderVideo ? (
                    <VideoPlayer
                      key={`video-${post.id}-${attachment.id}`}
                      source={attachment.get_image}
                      style={styles.postImage}
                      isVisible={isActiveSlide}
                      shouldAutoPlay={true}
                    />
                  ) : isVideo ? (
                    // Show placeholder for video when not visible
                    <View style={[styles.postImage, styles.videoPlaceholder]}>
                      <PlayCircleIcon width={64} height={64} fill="#FFFFFF" />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: attachment.get_image }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {post.attachments.length > 1 && (
            <View style={styles.paginationDots}>
              {post.attachments.map((_: any, index: number) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot,
                    activeSlide === index && styles.activeDot
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Post Caption - Now below images */}
      {onBodyPress ? (
        <TouchableOpacity 
          onPress={() => onBodyPress(post.id)}
          activeOpacity={0.7}
          style={styles.bodyContainer}
        >
          {bodyContent}
        </TouchableOpacity>
      ) : (
        <View style={styles.bodyContainer}>
          {bodyContent}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(post.id)}
            disabled={isLiking}
          >
            <FinanceIcon 
              width={20} 
              height={20} 
              fill={post.likes?.includes(currentUser?.id) ? "#F4C430" : "#657786"} 
            />
            <Text style={styles.actionText}>
              {post.likes_count >= 1000 
                ? `${(post.likes_count / 1000).toFixed(1)}k` 
                : post.likes_count}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onCommentPress(post.id)}
          >
            <ChatBubbleIcon width={20} height={20} fill="#657786" />
            <Text style={styles.actionText}>
              {post.comments_count >= 1000 
                ? `${(post.comments_count / 1000).toFixed(1)}k` 
                : post.comments_count}
            </Text>
          </TouchableOpacity>

          {onHandshake && post.created_by.id !== currentUser?.id && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onHandshake(post.created_by.id)}
            >
              <HandshakeIcon width={20} height={20} fill="#657786" />
              <Text style={styles.actionText}>Colaborate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4C430',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2332',
  },
  timestamp: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followingButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  followButtonText: {
    color: '#1A2332',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#657786',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#8E8E93',
    fontWeight: 'bold',
  },
  menuDropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemTextDelete: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '600',
  },
  carouselContainer: {
    width: SCREEN_WIDTH - 24,
    marginHorizontal: 0,
  },
  postImage: {
    width: SCREEN_WIDTH - 24,
    height: (SCREEN_WIDTH - 24) * 1.33,
    backgroundColor: '#F5F8FA',
  },
  paginationDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  activeDot: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bodyContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1A2332',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 24,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 14,
    color: '#657786',
    fontWeight: '500',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  commentButtonText: {
    fontSize: 14,
    color: '#657786',
    fontWeight: '500',
  },
  videoPlaceholder: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
