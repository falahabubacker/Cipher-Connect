import React from 'react';
import { StyleSheet, ViewStyle, View, Text, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

interface VideoPlayerProps {
  source: string;
  style?: ViewStyle;
  isVisible?: boolean;
  shouldAutoPlay?: boolean;
}

function VideoPlayer({ source, style, isVisible = true, shouldAutoPlay = true }: VideoPlayerProps) {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const mountCountRef = React.useRef(0);

  // Increment mount count
  React.useEffect(() => {
    mountCountRef.current++;
    console.log(`VideoPlayer mounted (count: ${mountCountRef.current}) for:`, source.substring(source.lastIndexOf('/') + 1));
    return () => {
      console.log(`VideoPlayer unmounted for:`, source.substring(source.lastIndexOf('/') + 1));
    };
  }, [source]);

  // Create player only once per source
  const player = useVideoPlayer(source, (player) => {
    player.loop = true;
    player.muted = false;
  });

  // Control playback based on visibility
  React.useEffect(() => {
    if (player && shouldAutoPlay) {
      if (isVisible) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [player, isVisible, shouldAutoPlay]);

  // Listen to player status changes
  React.useEffect(() => {
    if (player) {
      const subscription = player.addListener('statusChange', (status) => {
        if (status === 'readyToPlay') {
          setLoading(false);
          if (isVisible && shouldAutoPlay) {
            player.play();
          }
        }
      });
      return () => subscription.remove();
    }
  }, [player, isVisible, shouldAutoPlay]);

  if (error) {
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
          setError(true);
          setLoading(false);
        }}
      />
    </View>
  );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(VideoPlayer, (prevProps, nextProps) => {
  return (
    prevProps.source === nextProps.source &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.shouldAutoPlay === nextProps.shouldAutoPlay
  );
});

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
