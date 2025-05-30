import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
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
import { UnifiedLanguagesManager } from '../../../../src/core/UnifiedLanguagesManager';
import { useObsImage } from '../../../../src/hooks/useObsImage';

export default function StoriesScreen() {
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stories, setStories] = useState<CollectionStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [progressMap, setProgressMap] = useState<Map<number, UserProgress>>(new Map());
  const [isRTL, setIsRTL] = useState(false);

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

  const detectLanguageDirection = useCallback(async (collection: Collection) => {
    try {
      const languagesManager = UnifiedLanguagesManager.getInstance();
      await languagesManager.initialize();
      const languageData = await languagesManager.getLanguage(collection.language);
      setIsRTL(languageData?.ld === 'rtl');
    } catch (error) {
      console.error('Error detecting language direction:', error);
      setIsRTL(false);
    }
  }, []);

  const loadStories = useCallback(
    async (collectionId: string) => {
      try {
        setStoriesLoading(true);
        const collectionsManager = CollectionsManager.getInstance();
        await collectionsManager.initialize();
        const collectionStories = await collectionsManager.getCollectionStories(collectionId);
        setStories(collectionStories);

        // Load progress after stories are loaded
        await loadProgress(collectionId, collectionStories);
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setStoriesLoading(false);
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
      detectLanguageDirection(currentCollection);
    }
  }, [currentCollection, loadStories, detectLanguageDirection]);

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

  const StoryThumbnail = ({ storyNumber }: { storyNumber: number }) => {
    const thumbnailImage = useObsImage({
      reference: {
        story: storyNumber,
        frame: 1, // Always use the first frame for thumbnail
      },
    });

    return (
      <View
        className="relative"
        style={{
          width: 72,
          height: 72,
          borderRadius: 12,
          marginRight: isRTL ? 0 : 12,
          marginLeft: isRTL ? 12 : 0,
          overflow: 'hidden',
        }}>
        <Image
          source={thumbnailImage}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />
      </View>
    );
  };

  const renderStoryItem = ({ item }: { item: CollectionStory }) => {
    const progressPercent = getProgressPercentage(item.storyNumber);

    return (
      <TouchableOpacity
        className={`mb-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          padding: 16,
        }}
        onPress={() =>
          router.push(
            `/story/${encodeURIComponent(currentCollection?.id || '')}/${item.storyNumber}/1`
          )
        }>

        {/* Story Thumbnail */}
        <StoryThumbnail storyNumber={item.storyNumber} />

        {/* Story Content */}
        <View style={{ flex: 1 }}>
          {/* Header Row: Story Number + Favorite */}
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
            <View
              className={`px-2 py-1 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialIcons
                name="auto-stories"
                size={12}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.storyNumber}
              </Text>
            </View>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleStoryFavorite(item);
              }}
              className="rounded-full p-1">
              <MaterialIcons
                name={item.isFavorite ? 'favorite' : 'favorite-border'}
                size={20}
                color={item.isFavorite ? '#EF4444' : isDark ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>

          {/* Story Title */}
          <View style={{ marginBottom: progressPercent > 0 ? 12 : 0 }}>
            <Text
              className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-6`}
              style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {item.title}
            </Text>
          </View>

          {/* Progress Bar */}
          {progressPercent > 0 && (
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 10,
              }}>
              <View
                className={`flex-1 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  overflow: 'hidden',
                }}>
                <View
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
              <Text
                className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} min-w-[35px]`}
                style={{ textAlign: 'right' }}>
                {progressPercent}%
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCollectionSelector = () => (
    <View
      className={`absolute top-20 left-4 right-4 z-10 rounded-2xl p-6 shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      {collections.map((collection) => (
        <TouchableOpacity
          key={collection.id}
          className={`mb-3 p-4 rounded-xl border ${
            currentCollection?.id === collection.id
              ? isDark ? 'bg-blue-600 border-blue-500' : 'bg-blue-50 border-blue-200'
              : isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}
          onPress={() => selectCollection(collection)}>
          <Text
            className={`text-base font-semibold ${
              currentCollection?.id === collection.id
                ? isDark ? 'text-white' : 'text-blue-900'
                : isDark ? 'text-white' : 'text-gray-900'
            }`}
            style={{ textAlign: isRTL ? 'right' : 'left' }}
            numberOfLines={1}>
            {collection.displayName}
          </Text>
          <Text
            className={`mt-1 text-sm ${
              currentCollection?.id === collection.id
                ? isDark ? 'text-blue-200' : 'text-blue-600'
                : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
            style={{ textAlign: isRTL ? 'right' : 'left' }}
            numberOfLines={1}>
            {collection.language}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        className={`mt-4 p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        onPress={() => setShowCollectionSelector(false)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="close" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 justify-center items-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
        <View className="mt-4 items-center">
          <MaterialIcons
            name="auto-stories"
            size={48}
            color={isDark ? '#4B5563' : '#9CA3AF'}
          />
          <Text className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View
        className={`px-4 py-3 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 12,
        }}>
        <Pressable
          onPress={() => router.push('/(tabs)/(read)')}
          className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <MaterialIcons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={20}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
        </Pressable>

        <TouchableOpacity
          className="flex-1"
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 8,
          }}
          onPress={() => setShowCollectionSelector(true)}>
          <View style={{ flex: 1 }}>
            <Text
              className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
              style={{ textAlign: isRTL ? 'right' : 'left' }}
              numberOfLines={1}>
              {currentCollection?.displayName || 'Select Collection'}
            </Text>
          </View>
          <MaterialIcons
            name="expand-more"
            size={24}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
        </TouchableOpacity>
      </View>

      {showCollectionSelector && renderCollectionSelector()}

      {/* Stories List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}>
        {storiesLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
            <View className="mt-6 items-center">
              <MaterialIcons
                name="auto-stories"
                size={64}
                color={isDark ? '#4B5563' : '#9CA3AF'}
              />
            </View>
          </View>
        ) : stories.length > 0 ? (
          stories.map((item) => (
            <View key={`${item.collectionId}_${item.storyNumber}`}>
              {renderStoryItem({ item })}
            </View>
          ))
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <MaterialIcons
              name="auto-stories"
              size={80}
              color={isDark ? '#4B5563' : '#9CA3AF'}
            />
            <TouchableOpacity
              className={`mt-8 px-6 py-3 rounded-xl ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg`}
              onPress={() => router.push('/downloads')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="download" size={20} color="white" />
                <Text className="text-white font-semibold">
                  Download Collections
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
