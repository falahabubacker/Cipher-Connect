import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import VideoPlayer from '../components/VideoPlayer';
import { useCreatePost } from '../hooks/usePosts';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreatePostScreen({ navigation }: any) {
  const [postBody, setPostBody] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const createPostMutation = useCreatePost();

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
      videoMaxDuration: 60, // 60 seconds max
    });

    if (!result.canceled && result.assets) {
      setSelectedMedia([...selectedMedia, ...result.assets]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!postBody.trim() && selectedMedia.length === 0) {
      Alert.alert('Empty Post', 'Please add some text, images, or videos');
      return;
    }

    const formData = new FormData();
    formData.append('body', postBody);
    formData.append('is_private', 'false');

    // Add media to FormData
    selectedMedia.forEach((media, index) => {
      const uri = media.uri;
      const filename = uri.split('/').pop() || `media_${index}`;
      const isVideo = media.type === 'video';
      
      // Determine the file type
      const match = /\.(\w+)$/.exec(filename);
      const extension = match ? match[1].toLowerCase() : (isVideo ? 'mp4' : 'jpg');
      
      // Use proper MIME types, especially for iOS videos
      let type;
      if (isVideo) {
        // Map common video extensions to proper MIME types
        const videoTypes: { [key: string]: string } = {
          'mov': 'video/quicktime',
          'mp4': 'video/mp4',
          'm4v': 'video/mp4',
          'avi': 'video/x-msvideo',
          'webm': 'video/webm',
          'mkv': 'video/x-matroska'
        };
        type = videoTypes[extension] || 'video/mp4';
        console.log(`Uploading video: ${filename}, extension: ${extension}, MIME: ${type}`);
      } else {
        type = `image/${extension}`;
      }

      formData.append('image', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type,
      } as any);
    });

    createPostMutation.mutate(formData, {
      onSuccess: () => {
        Alert.alert('Success', 'Post created successfully!');
        navigation.goBack();
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.message || 'Failed to create post');
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          value={postBody}
          onChangeText={setPostBody}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          editable={!createPostMutation.isPending}
        />

        {selectedMedia.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.imagesTitle}>Selected Media ({selectedMedia.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedMedia.map((media, index) => (
                <View key={index} style={styles.imageWrapper}>
                  {media.type === 'video' ? (
                    <VideoPlayer
                      source={media.uri}
                      style={styles.imagePreview}
                    />
                  ) : (
                    <Image source={{ uri: media.uri }} style={styles.imagePreview} />
                  )}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMedia(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                  {media.type === 'video' && (
                    <View style={styles.videoLabel}>
                      <Text style={styles.videoLabelText}>🎥 Video</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.addImageButton}
          onPress={pickMedia}
          disabled={createPostMutation.isPending}
        >
          <Text style={styles.addImageButtonText}>📷 🎥 Add Photos/Videos</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={createPostMutation.isPending}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.postButton,
            createPostMutation.isPending && styles.postButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={createPostMutation.isPending}
        >
          {createPostMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imagesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addImageButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addImageButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postButton: {
    backgroundColor: '#007AFF',
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
