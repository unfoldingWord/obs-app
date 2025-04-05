import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface StoryFrame {
  id: string;
  text: string;
  imageUrl: string;
}

const MOCK_FRAMES: Record<string, StoryFrame[]> = {
  '01': [
    {
      id: '01-01',
      text: 'This is how God made everything in the beginning. He made the sky and the earth. The earth had no shape and was empty, and darkness covered the surface of the water. God\'s Spirit moved across the surface of the water.',
      imageUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-01.jpg',
    },
    {
      id: '01-02',
      text: 'Then God said, "Let there be light!" And there was light. God saw that the light was good and called it "day." He separated it from the darkness, which he called "night." God created the light on the first day of creation.',
      imageUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-02.jpg',
    },
    {
      id: '01-03',
      text: 'On the second day of creation, God spoke and created the sky above the earth. He made the sky by separating the water that was below from the water that was above.',
      imageUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-03.jpg',
    },
    {
      id: '01-04',
      text: 'On the third day, God spoke and separated the water from the dry land. He called the dry land "earth," and he called the water "seas." God saw that what he had created was good.',
      imageUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-04.jpg',
    },
    {
      id: '01-05',
      text: 'Then God said, "Let the earth produce all kinds of trees and plants." And that is what happened. God saw that what he had created was good.',
      imageUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-05.jpg',
    },
  ],
  '02': [
    {
      id: '02-01',
      text: 'God planted a garden in a place called Eden, and there he placed the man he had formed. God made all kinds of beautiful trees to grow in the garden, including the tree of life and the tree of the knowledge of good and evil. God put the man in Eden to care for and cultivate the garden. God told him, "You may eat from every tree in the garden, except for the tree of the knowledge of good and evil. If you eat its fruit, you will die."',
      imageUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-02-01.jpg',
    },
    {
      id: '02-02',
      text: 'Then God said, "It is not good for man to be alone." But none of the animals that God had created could be Adam\'s helper.',
      imageUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-02-02.jpg',
    },
    {
      id: '02-03',
      text: 'So God made the man fall into a deep sleep. Then God took one of Adam\'s ribs and made it into a woman and brought her to him.',
      imageUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-02-03.jpg',
    },
  ],
};

const STORY_TITLES: Record<string, string> = {
  '01': 'The Creation',
  '02': 'Sin Enters the World',
  '03': 'The Flood',
  '04': 'God\'s Covenant with Abraham',
  '05': 'The Son of Promise',
};

export default function StoryScreen() {
  const { language, id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [storyFrames, setStoryFrames] = useState<StoryFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const storyId = Array.isArray(id) ? id[0] : id;
  const storyLanguage = Array.isArray(language) ? language[0] : language;
  const storyTitle = STORY_TITLES[storyId as string] || 'Story';

  // Load story data
  useEffect(() => {
    // In a real app, this would come from an API or local storage
    setTimeout(() => {
      if (storyId && MOCK_FRAMES[storyId]) {
        setStoryFrames(MOCK_FRAMES[storyId]);
      } else {
        // Handle case where story doesn't exist
        console.warn(`Story with ID ${storyId} not found`);
      }
      setLoading(false);
    }, 500);
  }, [storyId]);

  const goToNextFrame = () => {
    if (currentFrameIndex < storyFrames.length - 1) {
      setCurrentFrameIndex(currentFrameIndex + 1);
    }
  };

  const goToPreviousFrame = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
    }
  };

  const currentFrame = storyFrames[currentFrameIndex];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading story...</Text>
      </View>
    );
  }

  if (!currentFrame) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>Story not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: storyTitle,
          headerBackTitle: 'Back',
        }}
      />
      <StatusBar barStyle="dark-content" />

      <View style={styles.frameContainer}>
        <Image
          source={{ uri: currentFrame.imageUrl }}
          style={styles.frameImage}
          resizeMode="contain"
        />

        <ScrollView style={styles.textContainer}>
          <Text style={styles.frameText}>{currentFrame.text}</Text>
        </ScrollView>

        <View style={styles.navigationContainer}>
          <Text style={styles.frameNumber}>
            {currentFrameIndex + 1} / {storyFrames.length}
          </Text>

          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, currentFrameIndex === 0 && styles.navButtonDisabled]}
              onPress={goToPreviousFrame}
              disabled={currentFrameIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={currentFrameIndex === 0 ? '#ccc' : '#4a90e2'}
              />
              <Text
                style={[
                  styles.navButtonText,
                  currentFrameIndex === 0 && styles.navButtonTextDisabled,
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                currentFrameIndex === storyFrames.length - 1 && styles.navButtonDisabled,
              ]}
              onPress={goToNextFrame}
              disabled={currentFrameIndex === storyFrames.length - 1}
            >
              <Text
                style={[
                  styles.navButtonText,
                  currentFrameIndex === storyFrames.length - 1 && styles.navButtonTextDisabled,
                ]}
              >
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={currentFrameIndex === storyFrames.length - 1 ? '#ccc' : '#4a90e2'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  frameContainer: {
    flex: 1,
    padding: 16,
  },
  frameImage: {
    width: '100%',
    height: height * 0.4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  textContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  frameText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
  },
  navigationContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  frameNumber: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: '500',
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
});
