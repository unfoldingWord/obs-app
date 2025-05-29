import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CollectionsManager,
  Collection,
  Story as CollectionStory,
} from '../../../../src/core/CollectionsManager';
import { StoryManager, UserProgress } from '../../../../src/core/storyManager';

export default function StoriesScreen() {
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stories, setStories] = useState<CollectionStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [progressMap, setProgressMap] = useState<Map<number, UserProgress>>(new Map());

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { collectionId } = useLocalSearchParams();

  const loadProgress = useCallback(async (collectionId: string, storiesList: CollectionStory[]) => {
    try {
      const storyManager = StoryManager.getInstance();
      await storyManager.initialize();
      const progressMap = new Map<number, UserProgress>();

      // Load progress for all stories in this collection
      for (const story of storiesList) {
        const progress = await storyManager.getReadingProgress(collectionId, story.storyNumber);
        if (progress) {
          progressMap.set(story.storyNumber, progress);
        }
      }

      setProgressMap(progressMap);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, []);

  const loadStories = useCallback(
    async (collectionId: string) => {
      try {
        const collectionsManager = CollectionsManager.getInstance();
        await collectionsManager.initialize();
        const collectionStories = await collectionsManager.getCollectionStories(collectionId);
        setStories(collectionStories);

        // Load progress after stories are loaded
        await loadProgress(collectionId, collectionStories);
      } catch (error) {
        console.error('Error loading stories:', error);
      }
    },
    [loadProgress]
  );

  const loadCollections = async () => {
    try {
      setLoading(true);
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.initialize();

      // Get downloaded collections
      const downloadedCollections = await collectionsManager.getLocalCollections();
      const downloaded = downloadedCollections.filter((c) => c.isDownloaded);

      setCollections(downloaded);

      if (downloaded.length > 0) {
        let selectedCollection = downloaded[0]; // Default to first

        // Check if a specific collection was requested via query parameter
        if (collectionId && typeof collectionId === 'string') {
          const requestedCollection = downloaded.find((c) => c.id === collectionId);
          if (requestedCollection) {
            selectedCollection = requestedCollection;
          }
        } else {
          // Try to get the last viewed collection from user progress
          const storyManager = StoryManager.getInstance();
          await storyManager.initialize();
          const allProgress = await storyManager.getAllReadingProgress();

          if (allProgress.length > 0) {
            // Find the most recently viewed collection
            const recentProgress = allProgress.sort((a, b) => b.timestamp - a.timestamp)[0];
            const recentCollection = downloaded.find((c) => c.id === recentProgress.collectionId);
            if (recentCollection) {
              selectedCollection = recentCollection;
            }
          }
        }

        setCurrentCollection(selectedCollection);
      } else {
        // No downloaded collections, redirect to downloads
        router.replace('/downloads');
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    if (currentCollection) {
      loadStories(currentCollection.id);
    }
  }, [currentCollection, loadStories]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentCollection) {
        loadStories(currentCollection.id);
      }
    }, [currentCollection, loadStories])
  );

  const selectCollection = (collection: Collection) => {
    setCurrentCollection(collection);
    setShowCollectionSelector(false);
  };

  const getProgressPercentage = (storyNumber: number): number => {
    const progress = progressMap.get(storyNumber);
    if (!progress) return 0;
    return Math.round((progress.frameNumber / progress.totalFrames) * 100);
  };

  const toggleStoryFavorite = async (story: CollectionStory) => {
    if (!currentCollection) return;

    try {
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.toggleStoryFavorite(currentCollection.id, story.storyNumber);

      // Reload stories to get updated favorite status
      await loadStories(currentCollection.id);
    } catch (error) {
      console.error('Error toggling story favorite:', error);
    }
  };

  const renderStoryItem = ({ item }: { item: CollectionStory }) => {
    const progressPercent = getProgressPercentage(item.storyNumber);

    return (
      <TouchableOpacity
        style={[
          styles.storyCard,
          isDark ? { backgroundColor: '#1F2937' } : { backgroundColor: '#fff' },
        ]}
        onPress={() =>
          router.push(
            `/story/${encodeURIComponent(currentCollection?.id || '')}/${item.storyNumber}/1`
          )
        }>
        {/* Story Content */}
        <View style={styles.storyInfo}>
          <View style={styles.storyHeader}>
            <Text
              style={[styles.storyNumber, isDark ? { color: '#9CA3AF' } : { color: '#6B7280' }]}>
              Story {item.storyNumber}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleStoryFavorite(item);
              }}
              style={{ padding: 4 }}>
              <MaterialIcons
                name={item.isFavorite ? 'favorite' : 'favorite-border'}
                size={20}
                color={item.isFavorite ? '#EF4444' : isDark ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.storyTitle, isDark ? { color: '#fff' } : { color: '#000' }]}>
            {item.title}
          </Text>

          {/* Progress Bar */}
          {progressPercent > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text
                style={[styles.progressText, isDark ? { color: '#9CA3AF' } : { color: '#6B7280' }]}>
                {progressPercent}%
              </Text>
            </View>
          )}
        </View>

        <MaterialIcons name="chevron-right" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
      </TouchableOpacity>
    );
  };

  const renderCollectionSelector = () => (
    <View
      style={[
        styles.collectionSelector,
        isDark ? { backgroundColor: '#374151' } : { backgroundColor: '#fff' },
      ]}>
      <Text style={[styles.selectorTitle, isDark ? { color: '#fff' } : { color: '#000' }]}>
        Select Collection
      </Text>
      {collections.map((collection) => (
        <TouchableOpacity
          key={collection.id}
          style={[
            styles.collectionOption,
            currentCollection?.id === collection.id &&
              (isDark ? { backgroundColor: '#1E40AF' } : { backgroundColor: '#DBEAFE' }),
          ]}
          onPress={() => selectCollection(collection)}>
          <View>
            <Text
              style={[
                styles.collectionOptionText,
                isDark ? { color: '#fff' } : { color: '#000' },
                currentCollection?.id === collection.id && { fontWeight: 'bold' },
              ]}>
              {collection.displayName}
            </Text>
            <Text
              style={[
                styles.collectionLanguage,
                isDark ? { color: '#9CA3AF' } : { color: '#6B7280' },
              ]}>
              {collection.language}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.closeButton} onPress={() => setShowCollectionSelector(false)}>
        <Text style={{ color: isDark ? '#60A5FA' : '#3B82F6' }}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centerContent,
          isDark ? { backgroundColor: '#111827' } : { backgroundColor: '#F3F4F6' },
        ]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
        <Text style={{ color: isDark ? '#9CA3AF' : '#4B5563', marginTop: 16 }}>
          Loading collections...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDark ? { backgroundColor: '#111827' } : { backgroundColor: '#F3F4F6' },
      ]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[
          styles.header,
          isDark ? { backgroundColor: '#1F2937' } : { backgroundColor: '#3B82F6' },
        ]}>
        <Pressable onPress={() => router.push('/(tabs)/(read)')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>

        <TouchableOpacity
          style={styles.collectionSelectorButton}
          onPress={() => setShowCollectionSelector(true)}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentCollection?.displayName || 'Select Collection'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {showCollectionSelector && renderCollectionSelector()}

      <FlatList
        data={stories}
        renderItem={renderStoryItem}
        keyExtractor={(item) => `${item.collectionId}_${item.storyNumber}`}
        contentContainerStyle={styles.storiesList}
        ListEmptyComponent={
          <View style={styles.centerContent}>
            <MaterialIcons name="library-books" size={48} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <Text
              style={{ color: isDark ? '#9CA3AF' : '#4B5563', marginTop: 16, textAlign: 'center' }}>
              No stories found in this collection
            </Text>
            <TouchableOpacity
              style={[
                styles.downloadButton,
                isDark ? { backgroundColor: '#1E40AF' } : { backgroundColor: '#3B82F6' },
              ]}
              onPress={() => router.push('/downloads')}>
              <Text style={{ color: '#fff' }}>Download Collections</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  collectionSelectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  storiesList: {
    padding: 16,
  },
  storyCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storyInfo: {
    flex: 1,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  storyNumber: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 32,
  },
  collectionSelector: {
    position: 'absolute',
    top: 85,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  collectionOption: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  collectionOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  collectionLanguage: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
  },
  downloadButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
});
