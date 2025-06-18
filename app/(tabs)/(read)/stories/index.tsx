import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CollectionsManager,
  Collection,
  Story as CollectionStory,
} from '@/core/CollectionsManager';
import { UnifiedLanguagesManager } from '@/core/UnifiedLanguagesManager';
import { StoryManager, UserProgress } from '@/core/storyManager';
import { useObsImage } from '@/hooks/useObsImage';
import { useStoryNavigation } from '@/hooks/useStoryNavigation';

type ReadingMode = 'horizontal' | 'vertical';

export default function StoriesScreen() {
  const { collectionId: collectionIdParam } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [stories, setStories] = useState<CollectionStory[]>([]);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [progressMap, setProgressMap] = useState<Map<number, UserProgress>>(new Map());
  const [isRTL, setIsRTL] = useState(false);
  const [preferredReadingMode, setPreferredReadingMode] = useState<ReadingMode>('horizontal');
  const router = useRouter();
  const { navigateToStoryStart } = useStoryNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
        setLoading(true);
        const collectionsManager = CollectionsManager.getInstance();
        await collectionsManager.initialize();
        const collectionStories = await collectionsManager.getCollectionStories(collectionId);
        setStories(collectionStories);

        // Load progress after stories are loaded
        await loadProgress(collectionId, collectionStories);
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setLoading(false);
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
        if (collectionIdParam && typeof collectionIdParam === 'string') {
          const requestedCollection = downloaded.find((c) => c.id === collectionIdParam);
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

  const navigateToStory = (item: CollectionStory) => {
    const collectionIdParam = encodeURIComponent(currentCollection?.id || '');
    navigateToStoryStart(collectionIdParam, item.storyNumber);
  };

  const toggleStoryFavorite = async (story: CollectionStory) => {
    if (!currentCollection) return;

    try {
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.toggleStoryFavorite(currentCollection.id, story.storyNumber);

      // Update local state directly instead of reloading all stories
      setStories((prevStories) =>
        prevStories.map((s) =>
          s.storyNumber === story.storyNumber ? { ...s, isFavorite: !s.isFavorite } : s
        )
      );
    } catch (error) {
      console.error('Error toggling story favorite:', error);
      // On error, reload stories to ensure consistency
      await loadStories(currentCollection.id);
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
    const sourceReference = item.metadata?.sourceReference;

    return (
      <TouchableOpacity
        onPress={() => navigateToStory(item)}
        className={`mb-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          padding: 16,
        }}>
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
              className={`rounded-md px-2 py-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialIcons name="auto-stories" size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
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
          <View style={{ marginBottom: progressPercent > 0 ? 12 : 8 }}>
            <Text
              className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-6`}
              style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {item.title}
            </Text>

            {/* Source Reference - Simplified */}
            {sourceReference && (
              <TouchableOpacity
                onLongPress={() => {
                  Alert.alert('', sourceReference, [{ text: 'OK' }]);
                }}
                activeOpacity={0.7}>
                <Text
                  className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                  numberOfLines={1}>
                  {sourceReference}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Progress Bar */}
          {progressPercent > 0 && (
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}>
              <View
                className={`h-2 flex-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  overflow: 'hidden',
                }}>
                <View
                  className="h-full rounded-full bg-green-500"
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
      className={`absolute left-4 right-4 top-20 z-10 rounded-2xl border p-6 shadow-lg ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
      {collections.map((collection) => (
        <TouchableOpacity
          key={collection.id}
          className={`mb-3 rounded-xl border p-4 ${
            currentCollection?.id === collection.id
              ? isDark
                ? 'border-blue-500 bg-blue-600'
                : 'border-blue-200 bg-blue-50'
              : isDark
                ? 'border-gray-600 bg-gray-700'
                : 'border-gray-200 bg-gray-50'
          }`}
          onPress={() => selectCollection(collection)}>
          <Text
            className={`text-base font-semibold ${
              currentCollection?.id === collection.id
                ? isDark
                  ? 'text-white'
                  : 'text-blue-900'
                : isDark
                  ? 'text-white'
                  : 'text-gray-900'
            }`}
            style={{ textAlign: isRTL ? 'right' : 'left' }}
            numberOfLines={1}>
            {collection.displayName}
          </Text>
          <Text
            className={`mt-1 text-sm ${
              currentCollection?.id === collection.id
                ? isDark
                  ? 'text-blue-200'
                  : 'text-blue-600'
                : isDark
                  ? 'text-gray-400'
                  : 'text-gray-500'
            }`}
            style={{ textAlign: isRTL ? 'right' : 'left' }}
            numberOfLines={1}>
            {collection.language}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        className={`mt-4 rounded-xl p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        onPress={() => setShowCollectionSelector(false)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="close" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </View>
      </TouchableOpacity>
    </View>
  );

  // Reading mode preference management
  const loadReadingModePreference = useCallback(async () => {
    try {
      const savedMode = await AsyncStorage.getItem('readingModePreference');
      if (savedMode === 'horizontal' || savedMode === 'vertical') {
        setPreferredReadingMode(savedMode);
      }
    } catch (error) {
      console.error('Error loading reading mode preference:', error);
    }
  }, []);

  const saveReadingModePreference = useCallback(async (mode: ReadingMode) => {
    try {
      await AsyncStorage.setItem('readingModePreference', mode);
      setPreferredReadingMode(mode);
    } catch (error) {
      console.error('Error saving reading mode preference:', error);
    }
  }, []);

  useEffect(() => {
    loadReadingModePreference();
  }, [loadReadingModePreference]);

  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
        <View className="mt-4 items-center">
          <MaterialIcons name="auto-stories" size={48} color={isDark ? '#4B5563' : '#9CA3AF'} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View
        className={`border-b px-4 py-3 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 12,
        }}>
        <Pressable
          onPress={() => router.push('/(tabs)/(read)')}
          className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <MaterialIcons
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
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
          <MaterialIcons name="expand-more" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const newMode = preferredReadingMode === 'horizontal' ? 'vertical' : 'horizontal';
            saveReadingModePreference(newMode);
          }}
          className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <MaterialIcons
            name={preferredReadingMode === 'vertical' ? 'view-stream' : 'view-carousel'}
            size={20}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
        </TouchableOpacity>
      </View>

      {showCollectionSelector && renderCollectionSelector()}

      {/* Stories List */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
            <View className="mt-6 items-center">
              <MaterialIcons name="auto-stories" size={64} color={isDark ? '#4B5563' : '#9CA3AF'} />
            </View>
          </View>
        ) : stories.length > 0 ? (
          stories.map((item) => (
            <View key={`${item.collectionId}_${item.storyNumber}`}>
              {renderStoryItem({ item })}
            </View>
          ))
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <MaterialIcons name="auto-stories" size={80} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <TouchableOpacity
              className={`mt-8 rounded-xl px-6 py-3 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg`}
              onPress={() => router.push('/downloads')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="download" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
