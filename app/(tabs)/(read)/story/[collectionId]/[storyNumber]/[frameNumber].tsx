import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useObsImage } from 'hooks/useObsImage';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CollectionsManager,
  Collection,
  Story,
  Frame,
} from '../../../../../../src/core/CollectionsManager';
import { StoryManager, UserMarker } from '../../../../../../src/core/storyManager';

export default function StoryFrameScreen() {
  const { collectionId: encodedCollectionId, storyNumber, frameNumber } = useLocalSearchParams();
  const collectionId = decodeURIComponent(encodedCollectionId as string);
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<Frame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalFrames, setTotalFrames] = useState(0);
  const image = useObsImage({
    reference: {
      story: parseInt(storyNumber as string, 10),
      frame: parseInt(frameNumber as string, 10),
    },
  });
  const [currentFrameNumber, setCurrentFrameNumber] = useState(
    frameNumber ? parseInt(frameNumber as string, 10) : 1
  );
  const [markers, setMarkers] = useState<UserMarker[]>([]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadStoryData();
  }, [collectionId, storyNumber]);

  // Effect to update when frame number changes
  useEffect(() => {
    if (frameNumber) {
      const frameNum = parseInt(frameNumber as string, 10);
      setCurrentFrameNumber(frameNum);

      if (story && collection) {
        navigateToFrame(frameNum);
      }
    }
  }, [frameNumber]);

  // Effect to save reading progress whenever frame changes
  useEffect(() => {
    if (story && collection && currentFrame) {
      saveReadingProgress();
      loadMarkers();
    }
  }, [currentFrameNumber, story, collection]);

  const loadStoryData = async () => {
    if (!collectionId || !storyNumber) {
      setError('Collection ID or Story Number is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading story data:', { collectionId, storyNumber, frameNumber });

      const collectionsManager = CollectionsManager.getInstance();
      const storyManager = StoryManager.getInstance();

      await collectionsManager.initialize();
      await storyManager.initialize();

      // Get collection details
      console.log('Getting collection details for:', collectionId);
      const collectionDetails = await collectionsManager.getCollectionById(collectionId as string);
      console.log('Collection details:', collectionDetails);
      setCollection(collectionDetails);

      if (!collectionDetails) {
        setError(`Collection not found: ${collectionId}`);
        setLoading(false);
        return;
      }

      // Get story details
      console.log('Getting story details for:', collectionId, parseInt(storyNumber as string, 10));
      const storyData = await storyManager.getStory(
        collectionId as string,
        parseInt(storyNumber as string, 10)
      );
      console.log('Story data:', storyData);

      if (!storyData) {
        setError(`Story not found: ${storyNumber}`);
        setLoading(false);
        return;
      }

      setStory(storyData);

      // Get story frames
      console.log('Getting story frames for:', collectionId, parseInt(storyNumber as string, 10));
      const storyFrames = await storyManager.getStoryFrames(
        collectionId as string,
        parseInt(storyNumber as string, 10)
      );
      console.log('Story frames:', storyFrames);

      if (!storyFrames || storyFrames.length === 0) {
        setError('No frames found for this story');
        setLoading(false);
        return;
      }

      setFrames(storyFrames);
      setTotalFrames(storyFrames.length);

      // Set current frame using the local storyFrames variable
      console.log('Setting current frame to:', currentFrameNumber);
      navigateToFrame(currentFrameNumber, storyFrames);

      setError(null);
    } catch (err) {
      console.error('Error loading story:', err);
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const loadMarkers = async () => {
    if (!collectionId || !storyNumber || !currentFrameNumber) return;

    try {
      const storyManager = StoryManager.getInstance();
      const frameMarkers = await storyManager.getMarkersForFrame(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        currentFrameNumber
      );
      setMarkers(frameMarkers);
    } catch (error) {
      console.error('Error loading markers:', error);
    }
  };

  const navigateToFrame = (frameNum: number, framesToUse?: Frame[]) => {
    const frameArray = framesToUse || frames;
    if (!frameArray || frameArray.length === 0) return;

    console.log('Navigating to frame:', frameNum, 'from frames:', frameArray.length);

    // Ensure frame number is within bounds
    const safeFrameNumber = Math.max(1, Math.min(frameNum, frameArray.length));

    // Find the frame with matching frameNumber
    const frame = frameArray.find((f) => f.frameNumber === safeFrameNumber);
    console.log('Found frame:', frame);
    if (!frame) return;

    // Set current frame
    setCurrentFrame(frame);
    setCurrentFrameNumber(safeFrameNumber);

    // Update URL if needed
    if (safeFrameNumber !== parseInt(frameNumber as string, 10)) {
      router.setParams({ frameNumber: safeFrameNumber.toString() });
    }
  };

  const saveReadingProgress = async () => {
    if (!collectionId || !storyNumber) return;

    try {
      const storyManager = StoryManager.getInstance();
      await storyManager.saveReadingProgress(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        currentFrameNumber,
        totalFrames
      );
    } catch (err) {
      console.error('Error saving reading progress:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!collectionId || !storyNumber || !currentFrameNumber) return;

    try {
      const storyManager = StoryManager.getInstance();
      await storyManager.toggleFrameFavorite(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        currentFrameNumber
      );

      // Reload the frame to get updated favorite status
      if (currentFrame) {
        const updatedFrame = await storyManager.getFrame(
          collectionId as string,
          parseInt(storyNumber as string, 10),
          currentFrameNumber
        );
        if (updatedFrame) {
          setCurrentFrame(updatedFrame);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const addMarker = async (note?: string) => {
    if (!collectionId || !storyNumber || !currentFrameNumber) return;

    try {
      const storyManager = StoryManager.getInstance();
      await storyManager.addMarker(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        currentFrameNumber,
        note
      );
      await loadMarkers(); // Reload markers
    } catch (error) {
      console.error('Error adding marker:', error);
    }
  };

  const goToNextFrame = () => {
    if (currentFrameNumber < totalFrames) {
      navigateToFrame(currentFrameNumber + 1);
    }
  };

  const goToPreviousFrame = () => {
    if (currentFrameNumber > 1) {
      navigateToFrame(currentFrameNumber - 1);
    }
  };

  // Handle swipe gestures
  const onSwipeGestureEvent = (event: any) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.END) {
      const swipeThreshold = 50; // Minimum distance for a swipe

      if (translationX > swipeThreshold) {
        // Swipe right - go to previous frame
        goToPreviousFrame();
      } else if (translationX < -swipeThreshold) {
        // Swipe left - go to next frame
        goToNextFrame();
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Stack.Screen
          options={{
            title: story?.title || `Story ${storyNumber}`,
            headerStyle: {
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            },
            headerTintColor: isDark ? '#FFFFFF' : '#000000',
          }}
        />
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading story...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !currentFrame) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Stack.Screen
          options={{
            title: story?.title || `Story ${storyNumber}`,
            headerStyle: {
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            },
            headerTintColor: isDark ? '#FFFFFF' : '#000000',
          }}
        />
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center p-4">
          <MaterialIcons name="error-outline" size={48} color={isDark ? '#F87171' : '#EF4444'} />
          <Text
            className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {error || 'Failed to load frame'}
          </Text>
          <TouchableOpacity
            className={`mt-4 rounded-lg px-6 py-3 ${isDark ? 'bg-blue-900' : 'bg-blue-600'}`}
            onPress={() => router.back()}>
            <Text className="font-medium text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Stack.Screen
          options={{
            title: story?.title || `Story ${storyNumber}`,
            headerStyle: {
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              marginBottom: 0,
            },
            headerTintColor: isDark ? '#FFFFFF' : '#000000',
            headerRight: () => (
              <View className="flex-row space-x-2">
                <TouchableOpacity onPress={toggleFavorite} className="p-2">
                  <MaterialIcons
                    name={currentFrame?.isFavorite ? 'favorite' : 'favorite-border'}
                    size={24}
                    color={currentFrame?.isFavorite ? '#EF4444' : isDark ? '#FFFFFF' : '#000000'}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => addMarker()} className="p-2">
                  <MaterialIcons
                    name="bookmark-add"
                    size={24}
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* <PanGestureHandler onGestureEvent={onSwipeGestureEvent}> */}
        <View style={{ flex: 1 }}>
          <ScrollView className="flex-1">
            <View className="relative">
              <Image source={image} style={{ width: '100%', height: 200 }} resizeMode="cover" />

              {/* Markers indicator */}
              {markers.length > 0 && (
                <View className="absolute right-2 top-2">
                  <View
                    className={`flex-row items-center rounded-full px-2 py-1 ${
                      isDark ? 'bg-black/50' : 'bg-white/80'
                    }`}>
                    <MaterialIcons
                      name="bookmark"
                      size={16}
                      color={isDark ? '#FFD700' : '#F59E0B'}
                    />
                    <Text
                      className={`ml-1 text-xs font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                      {markers.length}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View className="p-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text
                  className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Frame {currentFrameNumber} of {totalFrames}
                </Text>
                {currentFrame?.isFavorite && (
                  <MaterialIcons name="favorite" size={20} color="#EF4444" />
                )}
              </View>

              <Text
                className={`text-lg leading-relaxed ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {currentFrame.text}
              </Text>

              {/* Display markers if any */}
              {markers.length > 0 && (
                <View className="mt-4">
                  <Text
                    className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Bookmarks ({markers.length})
                  </Text>
                  {markers.map((marker) => (
                    <View
                      key={marker.id}
                      className={`mb-2 rounded-lg p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 flex-row items-center">
                          <View
                            className="mr-2 h-3 w-3 rounded-full"
                            style={{ backgroundColor: marker.color || '#FFD700' }}
                          />
                          <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {new Date(marker.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            const storyManager = StoryManager.getInstance();
                            storyManager.deleteMarker(marker.id).then(() => loadMarkers());
                          }}
                          className="p-1">
                          <MaterialIcons
                            name="delete"
                            size={16}
                            color={isDark ? '#EF4444' : '#DC2626'}
                          />
                        </TouchableOpacity>
                      </View>
                      {marker.note && (
                        <Text className={`mt-1 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {marker.note}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        {/* </PanGestureHandler> */}

        {/* Navigation controls */}
        <View
          className={`flex-row items-center justify-between p-4 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <TouchableOpacity
            onPress={goToPreviousFrame}
            disabled={currentFrameNumber <= 1}
            className={`rounded-full p-3 ${
              currentFrameNumber <= 1
                ? isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
                : isDark
                  ? 'bg-blue-900'
                  : 'bg-blue-500'
            }`}>
            <MaterialIcons
              name="chevron-left"
              size={24}
              color={currentFrameNumber <= 1 ? (isDark ? '#4B5563' : '#9CA3AF') : '#FFFFFF'}
            />
          </TouchableOpacity>

          <View className="flex-row">
            {/* Frame indicators */}
            {[...Array(totalFrames)].map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => navigateToFrame(index + 1)}
                className={`mx-1 h-2 w-2 rounded-full ${
                  index + 1 === currentFrameNumber
                    ? isDark
                      ? 'bg-blue-400'
                      : 'bg-blue-500'
                    : isDark
                      ? 'bg-gray-600'
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={goToNextFrame}
            disabled={currentFrameNumber >= totalFrames}
            className={`rounded-full p-3 ${
              currentFrameNumber >= totalFrames
                ? isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
                : isDark
                  ? 'bg-blue-900'
                  : 'bg-blue-500'
            }`}>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={
                currentFrameNumber >= totalFrames ? (isDark ? '#4B5563' : '#9CA3AF') : '#FFFFFF'
              }
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
