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
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View
        className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          My Collections
        </Text>
      </View>

      <FlatList
        data={collections}
        renderItem={({ item }) => (
          <CollectionItem
            item={item}
            onPress={handleSelectCollection}
            onCollectionDeleted={refreshData}
            isDark={isDark}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <>
            {collections.length > 0 && lastReadProgress ? (
              <ContinueReading
                lastReadProgress={lastReadProgress}
                onPress={handleContinueReading}
                isDark={isDark}
              />
            ) : (
              // Show prominent download CTA when no reading progress
              <View className="mb-6">
                <Text
                  className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Get Started
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/downloads')}
                  className={`rounded-lg p-6 ${isDark ? 'bg-blue-900' : 'bg-blue-600'} shadow-lg`}>
                  <View className="items-center">
                    <MaterialIcons name="library-add" size={48} color="white" className="mb-2" />
                    <Text className="text-center text-xl font-bold text-white">
                      Download Your First Collection
                    </Text>
                    <Text className="mt-2 text-center text-sm text-blue-100">
                      Choose from Bible stories in different languages
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !lastReadProgress || !collections.length ? null : ( // Don't show if we already showed the prominent CTA above
            <View className="items-center justify-center py-8">
              <Text className={`text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No collections downloaded yet
              </Text>
            </View>
          )
        }
      />

      {/* Secondary Download Button - only show when user has reading progress */}
      {lastReadProgress && collections.length > 0 && (
        <View className="p-4">
          <TouchableOpacity
            onPress={() => router.push('/downloads')}
            className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="add" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text
                className={`ml-2 text-center font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Download More Collections
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
