import React from 'react';
import { StyleSheet, ViewStyle, View, Text, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

interface VideoPlayerProps {
  source: string;
  style?: ViewStyle;
  isVisible?: boolean;
  shouldAutoPlay?: boolean;
}

export default function VideoPlayer({ source, style, isVisible = true, shouldAutoPlay = true }: VideoPlayerProps) {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    console.log('VideoPlayer rendering with source:', source);
    setLoading(true);
    setError(false);
  }, [source]);

  const player = useVideoPlayer(source, (player) => {
    player.loop = true;
    player.muted = false;
  });

  // Control playback based on visibility
  React.useEffect(() => {
    if (player && shouldAutoPlay) {
      if (isVisible) {
        console.log('Video visible, playing:', source);
        player.play();
      } else {
        console.log('Video not visible, pausing:', source);
        player.pause();
      }
    }
  }, [player, isVisible, shouldAutoPlay, source]);

  // Listen to player status changes
  React.useEffect(() => {
    if (player) {
      const subscription = player.addListener('statusChange', (status) => {
        console.log('Video status changed:', status, 'for:', source);
        if (status === 'readyToPlay') {
          setLoading(false);
          // Auto-play if visible
          if (isVisible && shouldAutoPlay) {
            player.play();
          }
        }
      });
      return () => subscription.remove();
    }
  }, [player, source, isVisible, shouldAutoPlay]);

  if (error) {
    console.log('VideoPlayer error for source:', source);
    return (
      <View style={[style, styles.errorContainer]}>
        <Text style={styles.errorText}>⚠️</Text>
        <Text style={styles.errorSubtext}>Video unavailable</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="contain"
        nativeControls
        onPlaybackError={(err) => {
          console.log('Video playback error:', err, 'for source:', source);
          setError(true);
          setLoading(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#666',
    fontSize: 12,
  },
  loadingContainer: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
