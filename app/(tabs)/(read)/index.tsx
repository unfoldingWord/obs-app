import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CollectionItem } from '../../../src/components/CollectionItem';
import { ContinueReading } from '../../../src/components/ContinueReading';
import { CollectionsManager, Collection } from '../../../src/core/CollectionsManager';
import { StoryManager, UserProgress } from '../../../src/core/storyManager';
import { useObsImage } from '../../../src/hooks/useObsImage';
import { useStoryNavigation } from '../../../src/hooks/useStoryNavigation';

type ReadingMode = 'horizontal' | 'vertical';

export default function ReadScreen() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [lastReadProgress, setLastReadProgress] = useState<UserProgress | null>(null);
  const [preferredReadingMode, setPreferredReadingMode] = useState<ReadingMode>('horizontal');
  const router = useRouter();
  const { navigateToStory } = useStoryNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get aesthetic image for empty state
  const aestheticImage = useObsImage({
    reference: { story: 28, frame: 10 },
  });

  // Get continue reading image (will be null if no lastReadProgress)
  const continueReadingImage = useObsImage({
    reference: lastReadProgress ? {
      story: lastReadProgress.storyNumber,
      frame: lastReadProgress.frameNumber
    } : { story: 1, frame: 1 },
  });

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
      navigateToStory(
        lastReadProgress.collectionId,
        lastReadProgress.storyNumber,
        lastReadProgress.frameNumber
      );
    }
  };

  const handleSelectCollection = async (collection: Collection) => {
    try {
      // Just navigate to the stories page, don't overwrite existing progress
      router.push(`/stories?collectionId=${encodeURIComponent(collection.id)}`);
    } catch (err) {
      console.error('Error navigating to collection:', err);
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

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CollectionItem
            key={item.id}
            item={item}
            onPress={handleSelectCollection}
            onCollectionDeleted={refreshData}
            isDark={isDark}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          lastReadProgress ? (
            <View>
              {/* Hero Section */}
              <View className="relative">
                <View className="pb-6 pt-8">
                  <View className="mb-6 flex-row items-center">
                    <MaterialIcons name="history" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
                    <View
                      className={`ml-3 flex-row items-center rounded-full px-3 py-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <MaterialIcons
                        name="schedule"
                        size={16}
                        color={isDark ? '#9CA3AF' : '#6B7280'}
                      />
                      <Text
                        className={`ml-2 text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                        {new Date(lastReadProgress.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Continue Reading Card */}
                  <View className="relative">
                    <ContinueReading
                      lastReadProgress={lastReadProgress}
                      onPress={handleContinueReading}
                      isDark={isDark}
                    />
                  </View>
                </View>
              </View>

              {/* Collections Section Header */}
              {collections.length > 0 && (
                <>
                  {/* Divider */}
                  <View className="mb-8">
                    <View className={`h-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} shadow-sm`} />
                  </View>

                  <View className="mb-6">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <MaterialIcons
                          name="local-library"
                          size={28}
                          color={isDark ? '#FFFFFF' : '#000000'}
                        />
                        <View
                          className={`ml-3 rounded-full px-3 py-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <Text
                            className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                            {collections.length}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => router.push('/downloads')}
                        className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <MaterialIcons
                          name="add"
                          size={24}
                          color={isDark ? '#9CA3AF' : '#6B7280'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          ) : collections.length > 0 ? (
            <View className="mb-6 pt-8">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="local-library"
                    size={28}
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                  <View
                    className={`ml-3 rounded-full px-3 py-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <Text
                      className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                      {collections.length}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => router.push('/downloads')}
                  className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <MaterialIcons
                    name="add"
                    size={24}
                    color={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          collections.length === 0 && !lastReadProgress ? (
            <View className="relative" style={{ height: 600 }}>
              {/* Gradient Background */}
              <LinearGradient
                colors={
                  isDark
                    ? ['#0F172A', '#1E293B', '#334155'] // Dark: slate gradient
                    : ['#F8FAFC', '#E2E8F0', '#CBD5E1'] // Light: subtle gray gradient
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                }}
              />

              {/* Optional subtle pattern overlay */}
              <View
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundColor: 'transparent',
                }}
              />

              {/* Centered Download Button */}
              <View className="flex-1 items-center justify-center px-6">
                <TouchableOpacity
                  onPress={() => router.push('/downloads')}
                  className={`rounded-full p-8 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-2xl`}
                  style={{
                    width: 120,
                    height: 120,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 20,
                  }}>
                  <MaterialIcons name="download" size={48} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={{ 
          paddingHorizontal: collections.length > 0 ? 24 : 0,
          paddingBottom: 32 
        }}
      />
    </SafeAreaView>
  );
}
