import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBar } from '../../components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface Story {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  frameCount: number;
  language: string;
}

// Mock data - This would come from your API in a real app
const MOCK_STORIES: Story[] = [
  {
    id: '01',
    title: 'The Creation',
    description: 'This is how God made everything in the beginning.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-01.jpg',
    frameCount: 16,
    language: 'en',
  },
  {
    id: '02',
    title: 'Sin Enters the World',
    description: 'Adam and Eve disobeyed God.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-02-01.jpg',
    frameCount: 12,
    language: 'en',
  },
  {
    id: '03',
    title: 'The Flood',
    description: 'God decided to destroy the whole world with a flood because the people were so evil.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-03-01.jpg',
    frameCount: 14,
    language: 'en',
  },
  {
    id: '04',
    title: 'God\'s Covenant with Abraham',
    description: 'God made a covenant with Abraham.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-04-01.jpg',
    frameCount: 15,
    language: 'en',
  },
  {
    id: '05',
    title: 'The Son of Promise',
    description: 'God fulfilled his promise to Abraham.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-05-01.jpg',
    frameCount: 10,
    language: 'en',
  },
  {
    id: '06',
    title: 'God Provides for Isaac',
    description: 'God provided a wife for Isaac.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-06-01.jpg',
    frameCount: 11,
    language: 'en',
  },
  {
    id: '07',
    title: 'God Blesses Jacob',
    description: 'God blessed Jacob and changed his name to Israel.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-07-01.jpg',
    frameCount: 13,
    language: 'en',
  },
  {
    id: '08',
    title: 'God Saves Joseph and His Family',
    description: 'God used Joseph to save his family from a famine.',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-08-01.jpg',
    frameCount: 14,
    language: 'en',
  },
];

// Calculate grid dimensions
const { width } = Dimensions.get('window');
const numColumns = 2;
const cardWidth = (width - 48) / numColumns; // 48 accounts for margins and padding

// Categories for filtering
const categories = [
  { id: 'all', name: 'All' },
  { id: 'fantasy', name: 'Fantasy' },
  { id: 'sci-fi', name: 'Sci-Fi' },
  { id: 'mystery', name: 'Mystery' },
  { id: 'thriller', name: 'Thriller' },
  { id: 'adventure', name: 'Adventure' }
];

export default function StoriesScreen() {
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load stories
  useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      setStories(MOCK_STORIES);
      setLoading(false);
    }, 800);
  }, []);

  // Filter stories based on search query and selected category
  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
                           story.language.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleStoryPress = (story: Story) => {
    router.push(`/story/${story.language}/${story.id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading stories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <SearchBar
          placeholder="Search stories or authors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        horizontal
        data={categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              selectedCategory === item.id && styles.categoryItemSelected
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text
              style={[
                styles.categoryItemText,
                selectedCategory === item.id && styles.categoryItemTextSelected
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        style={styles.categoriesList}
        showsHorizontalScrollIndicator={false}
      />

      <FlatList
        data={filteredStories}
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
    </SafeAreaView>
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
  categoriesList: {
    maxHeight: 50,
    backgroundColor: '#fff',
    paddingLeft: 8,
    marginBottom: 4,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
    backgroundColor: '#f0f0f0',
  },
  categoryItemSelected: {
    backgroundColor: '#4a90e2',
  },
  categoryItemText: {
    color: '#555',
    fontWeight: '500',
  },
  categoryItemTextSelected: {
    color: '#fff',
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
