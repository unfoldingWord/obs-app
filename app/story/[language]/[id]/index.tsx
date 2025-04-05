import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StoryImage } from '../../../../src/components/StoryImage';

// Mock story data
const MOCK_STORY = {
  id: '01',
  title: 'The Creation',
  introduction: 'This is how God made everything in the beginning.',
  frames: [
    {
      id: '01',
      number: 1,
      text: "This is how God made everything in the beginning. He created the universe and everything in it in six days. After God created the earth it was dark and empty because he had not yet formed anything in it. But God's Spirit was there over the water.",
      image: {
        url: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-01.jpg',
        resolutions: {
          low: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-01.jpg',
          medium: 'https://cdn.door43.org/obs/jpg/720px/obs-en-01-01.jpg',
          high: 'https://cdn.door43.org/obs/jpg/1080px/obs-en-01-01.jpg',
        },
      },
    },
    {
      id: '02',
      number: 2,
      text: 'Then God said, "Let there be light!" And there was light. God saw that the light was good and called it "day." He separated it from the darkness, which he called "night." God created the light on the first day of creation.',
      image: {
        url: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-02.jpg',
        resolutions: {
          low: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-02.jpg',
          medium: 'https://cdn.door43.org/obs/jpg/720px/obs-en-01-02.jpg',
          high: 'https://cdn.door43.org/obs/jpg/1080px/obs-en-01-02.jpg',
        },
      },
    },
    {
      id: '03',
      number: 3,
      text: 'On the second day of creation, God said, "Let there be an expanse above the waters." And there was an expanse. God called this expanse "sky."',
      image: {
        url: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-03.jpg',
        resolutions: {
          low: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-03.jpg',
          medium: 'https://cdn.door43.org/obs/jpg/720px/obs-en-01-03.jpg',
          high: 'https://cdn.door43.org/obs/jpg/1080px/obs-en-01-03.jpg',
        },
      },
    },
  ],
  reference: 'A Bible story from: Genesis 1-2',
};

export default function StoryScreen() {
  const { language, id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [story, setStory] = useState<typeof MOCK_STORY | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Load story data
  useEffect(() => {
    // In a real app, this would fetch the story from your storage system
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setStory(MOCK_STORY);
      setLoading(false);
    }, 500);
  }, [id, language]);

  const goToNextFrame = () => {
    if (story && currentFrameIndex < story.frames.length - 1) {
      setCurrentFrameIndex(currentFrameIndex + 1);
    }
  };

  const goToPrevFrame = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading story...</Text>
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>Failed to load story</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentFrame = story.frames[currentFrameIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{story.title}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.frameCounter}>
            {currentFrameIndex + 1}/{story.frames.length}
          </Text>
        </View>
      </View>

      <View style={styles.storyContainer}>
        <StoryImage
          imageName={`obs-en-${story.id}-${currentFrame.id}` as any}
          fallbackUrl={currentFrame.image.resolutions[imageQuality]}
          style={{ width, height: width * 0.6 }}
        />

        <ScrollView style={styles.textContainer}>
          <Text style={styles.frameText}>{currentFrame.text}</Text>

          {currentFrameIndex === story.frames.length - 1 && (
            <Text style={styles.referenceText}>{story.reference}</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, currentFrameIndex === 0 && styles.disabledButton]}
          onPress={goToPrevFrame}
          disabled={currentFrameIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentFrameIndex === 0 ? '#ccc' : '#333'} />
          <Text style={[styles.navButtonText, currentFrameIndex === 0 && styles.disabledButtonText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentFrameIndex === story.frames.length - 1 && styles.disabledButton]}
          onPress={goToNextFrame}
          disabled={currentFrameIndex === story.frames.length - 1}
        >
          <Text style={[styles.navButtonText, currentFrameIndex === story.frames.length - 1 && styles.disabledButtonText]}>
            Next
          </Text>
          <Ionicons name="chevron-forward" size={24} color={currentFrameIndex === story.frames.length - 1 ? '#ccc' : '#333'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4a90e2',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginTop: 12,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
  },
  frameCounter: {
    fontSize: 14,
    color: '#888',
  },
  storyContainer: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    padding: 16,
  },
  frameText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333',
  },
  referenceText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  navButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#ccc',
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
