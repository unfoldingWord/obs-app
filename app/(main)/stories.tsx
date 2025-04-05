import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Story {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  frameCount: number;
}

// Mock data - This would come from your API in a real app
const MOCK_STORIES: Story[] = [
  {
    id: '01',
    title: 'The Creation',
    description: 'This is how God made everything in the beginning.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-01.jpg',
    frameCount: 16,
  },
  {
    id: '02',
    title: 'Sin Enters the World',
    description: 'Adam and Eve disobeyed God.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-02-01.jpg',
    frameCount: 12,
  },
  {
    id: '03',
    title: 'The Flood',
    description: 'God decided to destroy the whole world with a flood because the people were so evil.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-03-01.jpg',
    frameCount: 14,
  },
  {
    id: '04',
    title: 'God\'s Covenant with Abraham',
    description: 'God made a covenant with Abraham.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-04-01.jpg',
    frameCount: 15,
  },
  {
    id: '05',
    title: 'The Son of Promise',
    description: 'God fulfilled his promise to Abraham.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-05-01.jpg',
    frameCount: 10,
  },
  {
    id: '06',
    title: 'God Provides for Isaac',
    description: 'God provided a wife for Isaac.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-06-01.jpg',
    frameCount: 11,
  },
  {
    id: '07',
    title: 'God Blesses Jacob',
    description: 'God blessed Jacob and changed his name to Israel.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-07-01.jpg',
    frameCount: 13,
  },
  {
    id: '08',
    title: 'God Saves Joseph and His Family',
    description: 'God used Joseph to save his family from a famine.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-08-01.jpg',
    frameCount: 14,
  },
];

// Calculate grid dimensions
const { width } = Dimensions.get('window');
const numColumns = 2;
const cardWidth = (width - 48) / numColumns; // 48 accounts for margins and padding

export default function StoriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);

  // Load stories
  useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      setStories(MOCK_STORIES);
      setLoading(false);
    }, 800);
  }, []);

  const handleStoryPress = (story: Story) => {
    router.push(`/story/en/${story.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading stories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bible Stories</Text>
        <Text style={styles.headerSubtitle}>
          Explore all 50 key stories from the Bible
        </Text>
      </View>

      <FlatList
        data={stories}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.storyGrid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.storyCard, { width: cardWidth }]}
            onPress={() => handleStoryPress(item)}
          >
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.storyThumbnail}
              resizeMode="cover"
            />
            <View style={styles.storyInfo}>
              <Text style={styles.storyId}>{item.id}</Text>
              <Text style={styles.storyTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.storyMeta}>
                <Ionicons name="images-outline" size={12} color="#888" />
                <Text style={styles.storyFrameCount}>
                  {item.frameCount} frames
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  storyGrid: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storyThumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  storyInfo: {
    padding: 12,
  },
  storyId: {
    fontSize: 12,
    color: '#4a90e2',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    height: 40, // Limit height for 2 lines
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyFrameCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
});
