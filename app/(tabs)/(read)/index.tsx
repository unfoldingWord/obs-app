import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollectionItem } from '../../../src/components/CollectionItem';
import { ContinueReading } from '../../../src/components/ContinueReading';
import { CollectionsManager, Collection } from '../../../src/core/CollectionsManager';
import { StoryManager, UserProgress } from '../../../src/core/storyManager';

export default function ReadScreen() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [lastReadProgress, setLastReadProgress] = useState<UserProgress | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const collectionsManager = CollectionsManager.getInstance();
      const storyManager = StoryManager.getInstance();

      await collectionsManager.initialize();
      await storyManager.initialize();

      // Get downloaded collections
      const downloadedCollections = await collectionsManager.getLocalCollections();
      const downloaded = downloadedCollections.filter((c) => c.isDownloaded);
      setCollections(downloaded);

      // Get the most recent reading progress
      const allProgress = await storyManager.getAllReadingProgress();
      if (allProgress.length > 0) {
        const mostRecent = allProgress.sort((a, b) => b.timestamp - a.timestamp)[0];
        setLastReadProgress(mostRecent);
      } else {
        setLastReadProgress(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReadingProgress = useCallback(async () => {
    try {
      const storyManager = StoryManager.getInstance();
      await storyManager.initialize();

      // Get the most recent reading progress
      const allProgress = await storyManager.getAllReadingProgress();
      if (allProgress.length > 0) {
        const mostRecent = allProgress.sort((a, b) => b.timestamp - a.timestamp)[0];
        setLastReadProgress(mostRecent);
      } else {
        setLastReadProgress(null);
      }
    } catch (error) {
      console.error('Error loading reading progress:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const collectionsManager = CollectionsManager.getInstance();
      const storyManager = StoryManager.getInstance();

      await collectionsManager.initialize();
      await storyManager.initialize();

      // Refresh collections list
      const downloadedCollections = await collectionsManager.getLocalCollections();
      const downloaded = downloadedCollections.filter((c) => c.isDownloaded);
      setCollections(downloaded);

      // Refresh reading progress
      const allProgress = await storyManager.getAllReadingProgress();
      if (allProgress.length > 0) {
        const mostRecent = allProgress.sort((a, b) => b.timestamp - a.timestamp)[0];
        setLastReadProgress(mostRecent);
      } else {
        setLastReadProgress(null);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only reload if we're not already loading and we've loaded initial data
      if (!loading && collections.length >= 0) {
        refreshData();
      }
    }, [refreshData, loading, collections.length])
  );

  const handleContinueReading = () => {
    if (lastReadProgress) {
      router.push(
        `/story/${encodeURIComponent(lastReadProgress.collectionId)}/${lastReadProgress.storyNumber}/${lastReadProgress.frameNumber}`
      );
    }
  };

  const handleSelectCollection = async (collection: Collection) => {
    try {
      const storyManager = StoryManager.getInstance();
      // Save progress for story 1, frame 1 as the starting point
      await storyManager.saveReadingProgress(
        collection.id,
        1,
        1,
        10 // Default total frames, will be updated when actual story is loaded
      );

      router.push(`/stories?collectionId=${encodeURIComponent(collection.id)}`);
    } catch (err) {
      console.error('Error saving selected collection:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="relative">
          {lastReadProgress ? (
            <View className="px-6 pb-6 pt-8">
              <View className="mb-6 flex-row items-center">
                <MaterialIcons name="history" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
                <View
                  className={`ml-3 flex-row items-center rounded-full px-3 py-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <MaterialIcons name="schedule" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text
                    className={`ml-2 text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                    {new Date(lastReadProgress.timestamp).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <ContinueReading
                lastReadProgress={lastReadProgress}
                onPress={handleContinueReading}
                isDark={isDark}
              />
            </View>
          ) : (
            <View className="px-6 pb-8 pt-12">
              <View className="mb-8 flex-row items-center justify-center">
                <MaterialIcons
                  name="auto-stories"
                  size={48}
                  color={isDark ? '#FFFFFF' : '#000000'}
                />
              </View>

              {/* Hero CTA */}
              <TouchableOpacity
                onPress={() => router.push('/downloads')}
                className={`rounded-3xl p-6 ${isDark ? 'bg-white' : 'bg-black'} shadow-xl`}>
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="download" size={32} color={isDark ? '#000000' : '#FFFFFF'} />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Collections Section */}
        {collections.length > 0 && (
          <>
            {/* Divider */}
            {lastReadProgress && (
              <View className="mb-8 px-6">
                <View className={`h-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} shadow-sm`} />
              </View>
            )}

            <View className="px-6 pb-8">
              <View className="mb-6 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="library-books"
                    size={28}
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                  <View
                    className={`ml-3 rounded-full px-3 py-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                      {collections.length}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/downloads')}
                  className={`rounded-full p-3 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  <MaterialIcons name="add" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>
              </View>

              {/* Collections Grid */}
              <View className="space-y-4">
                {collections.map((item) => (
                  <CollectionItem
                    key={item.id}
                    item={item}
                    onPress={handleSelectCollection}
                    onCollectionDeleted={refreshData}
                    isDark={isDark}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {/* Empty State for Collections */}
        {collections.length === 0 && lastReadProgress && (
          <>
            {/* Divider */}
            <View className="mb-8 px-6">
              <View className={`h-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} shadow-sm`} />
            </View>

            <View
              className={`rounded-3xl p-12 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-400'} shadow-inner`}>
              <View className="items-center">
                <MaterialIcons name="download" size={64} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <TouchableOpacity
                  onPress={() => router.push('/downloads')}
                  className={`mt-8 rounded-2xl p-4 ${isDark ? 'bg-white' : 'bg-black'} shadow-lg`}>
                  <MaterialIcons name="add" size={24} color={isDark ? '#000000' : '#FFFFFF'} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
