import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollectionsManager, Story, Frame } from '../../src/core/CollectionsManager';
import { StoryManager, UserMarker } from '../../src/core/storyManager';

interface FavoriteStory extends Story {
  collectionDisplayName?: string;
  thumbnailUrl?: string;
}

export default function FavoritesScreen() {
  const [activeTab, setActiveTab] = useState<'stories' | 'markers'>('stories');
  const [loading, setLoading] = useState(true);
  const [favoriteStories, setFavoriteStories] = useState<FavoriteStory[]>([]);
  const [favoriteFrames, setFavoriteFrames] = useState<Frame[]>([]);
  const [markers, setMarkers] = useState<UserMarker[]>([]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loadFavoritesData = useCallback(async () => {
    try {
      setLoading(true);
      const collectionsManager = CollectionsManager.getInstance();
      const storyManager = StoryManager.getInstance();

      await collectionsManager.initialize();
      await storyManager.initialize();

      // Load favorite stories
      const favStories = await collectionsManager.getFavoriteStories();
      const storiesWithThumbnails = await Promise.all(
        favStories.map(async (story) => {
          const collection = await collectionsManager.getCollectionById(story.collectionId);
          return {
            ...story,
            collectionDisplayName: collection?.displayName || story.collectionId,
            thumbnailUrl: `https://cdn.door43.org/obs/jpg/360px/obs-en-${story.storyNumber.toString().padStart(2, '0')}-01.jpg`,
          };
        })
      );
      setFavoriteStories(storiesWithThumbnails);

      // Load favorite frames
      const favFrames = await collectionsManager.getFavoriteFrames();
      setFavoriteFrames(favFrames);

      // Load all markers
      const allMarkers = await storyManager.getAllMarkers();
      setMarkers(allMarkers);
    } catch (error) {
      console.error('Error loading favorites data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshFavoritesData = useCallback(async () => {
    try {
      const collectionsManager = CollectionsManager.getInstance();
      const storyManager = StoryManager.getInstance();

      await collectionsManager.initialize();
      await storyManager.initialize();

      // Load favorite stories
      const favStories = await collectionsManager.getFavoriteStories();
      const storiesWithThumbnails = await Promise.all(
        favStories.map(async (story) => {
          const collection = await collectionsManager.getCollectionById(story.collectionId);
          return {
            ...story,
            collectionDisplayName: collection?.displayName || story.collectionId,
            thumbnailUrl: `https://cdn.door43.org/obs/jpg/360px/obs-en-${story.storyNumber.toString().padStart(2, '0')}-01.jpg`,
          };
        })
      );
      setFavoriteStories(storiesWithThumbnails);

      // Load favorite frames
      const favFrames = await collectionsManager.getFavoriteFrames();
      setFavoriteFrames(favFrames);

      // Load all markers
      const allMarkers = await storyManager.getAllMarkers();
      setMarkers(allMarkers);
    } catch (error) {
      console.error('Error refreshing favorites data:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadFavoritesData();
  }, [loadFavoritesData]);

  // Refresh data when screen comes into focus (without loading state)
  useFocusEffect(
    useCallback(() => {
      refreshFavoritesData();
    }, [refreshFavoritesData])
  );

  const navigateToStory = (story: FavoriteStory) => {
    router.push(
      `/story/${encodeURIComponent(story.collectionId)}/${story.storyNumber}/1`
    );
  };

  const navigateToFrame = (frame: Frame) => {
    router.push(
      `/story/${encodeURIComponent(frame.collectionId)}/${frame.storyNumber}/${frame.frameNumber}`
    );
  };

  const navigateToMarker = (marker: UserMarker) => {
    router.push(
      `/story/${encodeURIComponent(marker.collectionId)}/${marker.storyNumber}/${marker.frameNumber}`
    );
  };

  const deleteMarker = async (markerId: string) => {
    try {
      const storyManager = StoryManager.getInstance();
      await storyManager.deleteMarker(markerId);
      await loadFavoritesData(); // Reload data
    } catch (error) {
      console.error('Error deleting marker:', error);
    }
  };

  const renderFavoriteStory = ({ item }: { item: FavoriteStory }) => (
    <TouchableOpacity
      onPress={() => navigateToStory(item)}
      className={`m-2 rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Image source={{ uri: item.thumbnailUrl }} className="w-full h-32" />
      <View className="p-4">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.title}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {item.collectionDisplayName}
        </Text>
        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Story {item.storyNumber}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFavoriteFrame = ({ item }: { item: Frame }) => (
    <TouchableOpacity
      onPress={() => navigateToFrame(item)}
      className={`m-2 rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Image source={{ uri: item.imageUrl }} className="w-full h-32" />
      <View className="p-4">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Story {item.storyNumber}, Frame {item.frameNumber}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {item.collectionId}
        </Text>
        <Text className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={2}>
          {item.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMarker = ({ item }: { item: UserMarker }) => (
    <TouchableOpacity
      onPress={() => navigateToMarker(item)}
      className={`m-2 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Story {item.storyNumber}, Frame {item.frameNumber}
        </Text>
        <TouchableOpacity
          onPress={() => deleteMarker(item.id)}
          className="p-1">
          <MaterialIcons
            name="delete"
            size={20}
            color={isDark ? '#EF4444' : '#DC2626'}
          />
        </TouchableOpacity>
      </View>
      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {item.collectionId}
      </Text>
      {item.note && (
        <Text className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {item.note}
        </Text>
      )}
      <View className="flex-row items-center mt-2">
        <View
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: item.color || '#FFD700' }}
        />
        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading favorites...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Favorites
        </Text>
        <View className="flex-row mt-4">
          <TouchableOpacity
            onPress={() => setActiveTab('stories')}
            className={`flex-1 py-2 rounded-l-lg ${
              activeTab === 'stories'
                ? isDark ? 'bg-blue-600' : 'bg-blue-500'
                : isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
            <Text
              className={`text-center ${
                activeTab === 'stories'
                  ? 'text-white'
                  : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Stories ({favoriteStories.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('markers')}
            className={`flex-1 py-2 rounded-r-lg ${
              activeTab === 'markers'
                ? isDark ? 'bg-blue-600' : 'bg-blue-500'
                : isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
            <Text
              className={`text-center ${
                activeTab === 'markers'
                  ? 'text-white'
                  : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Bookmarks ({markers.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'stories' ? (
        favoriteStories.length > 0 ? (
          <FlatList
            data={favoriteStories}
            renderItem={renderFavoriteStory}
            keyExtractor={(item) => `${item.collectionId}-${item.storyNumber}`}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <MaterialIcons
              name="favorite-border"
              size={48}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No favorite stories yet
            </Text>
            <Text className={`mt-2 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Tap the heart icon while reading to add stories to your favorites
            </Text>
          </View>
        )
      ) : markers.length > 0 ? (
        <FlatList
          data={markers}
          renderItem={renderMarker}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center p-4">
          <MaterialIcons
            name="bookmark-border"
            size={48}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
          <Text className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No bookmarks yet
          </Text>
          <Text className={`mt-2 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Tap the bookmark icon while reading to add markers to your collection
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
