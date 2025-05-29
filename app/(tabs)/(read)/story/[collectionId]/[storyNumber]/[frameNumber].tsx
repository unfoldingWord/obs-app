import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
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

import { NotesSection } from '../../../../../../src/components/CommentsSection';
import {
  CollectionsManager,
  Collection,
  Story,
  Frame,
} from '../../../../../../src/core/CollectionsManager';
import { StoryManager, UserMarker } from '../../../../../../src/core/storyManager';
import { useObsImage } from '../../../../../../src/hooks/useObsImage';

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
  const [currentFrameNumber, setCurrentFrameNumber] = useState(
    frameNumber ? parseInt(frameNumber as string, 10) : 1
  );
  const [markers, setMarkers] = useState<UserMarker[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get the image using the offline-first hook
  const imageSource = useObsImage({
    reference: {
      story: parseInt(storyNumber as string, 10),
      frame: currentFrameNumber,
    },
  });

  useEffect(() => {
    loadStoryData();
    loadFontSizePreference();
  }, [collectionId, storyNumber]);

  // Effect to update when frame number changes
  useEffect(() => {
    if (frameNumber) {
      const frameNum = parseInt(frameNumber as string, 10);
      setCurrentFrameNumber(frameNum);

      if (story && collection && frames.length > 0) {
        navigateToFrame(frameNum);
      }
    }
  }, [frameNumber, frames]);

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
      setError(null);
      console.log('Loading story data:', { collectionId, storyNumber, frameNumber });

      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.initialize();

      // Get collection details
      console.log('Getting collection details for:', collectionId);
      const collectionDetails = await collectionsManager.getCollection(collectionId as string);
      console.log('Collection details:', collectionDetails);

      if (!collectionDetails) {
        setError(`Collection not found: ${collectionId}`);
        setLoading(false);
        return;
      }
      setCollection(collectionDetails);

      // Get all stories in the collection
      console.log('Getting all stories for collection:', collectionId);
      const allStoriesData = await collectionsManager.getCollectionStories(collectionId as string);
      console.log('All stories:', allStoriesData);
      setAllStories(allStoriesData.sort((a, b) => a.storyNumber - b.storyNumber));

      // Get story details using CollectionsManager
      console.log('Getting story details for:', collectionId, parseInt(storyNumber as string, 10));
      const storyData = await collectionsManager.getStory(
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

      // Get story frames using CollectionsManager
      console.log('Getting story frames for:', collectionId, parseInt(storyNumber as string, 10));
      const storyFrames = await collectionsManager.getStoryFrames(
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

      // Set the current frame based on frameNumber
      const frameNum = frameNumber ? parseInt(frameNumber as string, 10) : 1;
      console.log('Looking for frame number:', frameNum);
      console.log(
        'Available frames:',
        storyFrames.map((f) => ({ frameNumber: f.frameNumber, text: f.text.substring(0, 50) }))
      );

      const initialFrame = storyFrames.find((f) => f.frameNumber === frameNum) || storyFrames[0];
      console.log('Initial frame:', initialFrame);

      if (initialFrame) {
        setCurrentFrame(initialFrame);
        setCurrentFrameNumber(initialFrame.frameNumber);
      } else {
        setError(`Frame ${frameNum} not found`);
        setLoading(false);
        return;
      }

      setError(null);
    } catch (err) {
      console.error('Error loading story:', err);
      setError(`Failed to load story: ${err instanceof Error ? err.message : String(err)}`);
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

    // Ensure frame number is within bounds
    const safeFrameNumber = Math.max(1, Math.min(frameNum, frameArray.length));

    // Find the frame with matching frameNumber
    const frame = frameArray.find((f) => f.frameNumber === safeFrameNumber);
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
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.toggleFrameFavorite(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        currentFrameNumber
      );

      // Reload the frame to get updated favorite status
      if (currentFrame) {
        const updatedFrame = await collectionsManager.getFrame(
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

  const loadFontSizePreference = async () => {
    try {
      const savedFontSize = await AsyncStorage.getItem('fontSizePreference');
      if (savedFontSize) {
        setFontSize(savedFontSize as 'small' | 'medium' | 'large' | 'xlarge');
      }
    } catch (error) {
      console.error('Error loading font size preference:', error);
    }
  };

  const changeFontSize = async (newSize: 'small' | 'medium' | 'large' | 'xlarge') => {
    try {
      setFontSize(newSize);
      await AsyncStorage.setItem('fontSizePreference', newSize);
      setShowFontSizeMenu(false);
    } catch (error) {
      console.error('Error saving font size preference:', error);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-base';
      case 'medium':
        return 'text-lg';
      case 'large':
        return 'text-xl';
      case 'xlarge':
        return 'text-2xl';
      default:
        return 'text-lg';
    }
  };

  const getNextStory = (): Story | null => {
    if (!allStories || !storyNumber) return null;

    const currentStoryNum = parseInt(storyNumber as string, 10);
    const currentIndex = allStories.findIndex((story) => story.storyNumber === currentStoryNum);

    if (currentIndex === -1 || currentIndex === allStories.length - 1) {
      return null; // No next story
    }

    return allStories[currentIndex + 1];
  };

  const getPreviousStory = (): Story | null => {
    if (!allStories || !storyNumber) return null;

    const currentStoryNum = parseInt(storyNumber as string, 10);
    const currentIndex = allStories.findIndex((story) => story.storyNumber === currentStoryNum);

    if (currentIndex === -1 || currentIndex === 0) {
      return null; // No previous story
    }

    return allStories[currentIndex - 1];
  };

  const goToNextFrame = () => {
    if (currentFrameNumber < totalFrames) {
      navigateToFrame(currentFrameNumber + 1);
    } else {
      // On last frame, try to go to next story
      const nextStory = getNextStory();
      if (nextStory) {
        router.push(`/story/${encodeURIComponent(collectionId)}/${nextStory.storyNumber}/1`);
      }
    }
  };

  const goToPreviousFrame = async () => {
    if (currentFrameNumber > 1) {
      navigateToFrame(currentFrameNumber - 1);
    } else {
      // On first frame, try to go to previous story's last frame
      const previousStory = getPreviousStory();
      if (previousStory) {
        try {
          const collectionsManager = CollectionsManager.getInstance();
          const previousStoryFrames = await collectionsManager.getStoryFrames(
            collectionId as string,
            previousStory.storyNumber
          );
          const lastFrameNumber = previousStoryFrames.length;
          router.push(
            `/story/${encodeURIComponent(collectionId)}/${previousStory.storyNumber}/${lastFrameNumber}`
          );
        } catch (error) {
          console.error('Error loading previous story frames:', error);
        }
      }
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
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Custom Header */}
        <View
          className={`flex-row items-center justify-between px-4 py-3 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <TouchableOpacity
            onPress={() => router.push(`/stories?collection=${encodeURIComponent(collectionId)}`)}
            className="p-2">
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>

          <Text
            className={`flex-1 text-center text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            numberOfLines={1}>
            {story?.title || `Story ${storyNumber}`}
          </Text>

          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setShowFontSizeMenu(!showFontSizeMenu)}
              className="p-2">
              <MaterialIcons name="text-fields" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFavorite} className="p-2">
              <MaterialIcons
                name={currentFrame?.isFavorite ? 'favorite' : 'favorite-border'}
                size={24}
                color={currentFrame?.isFavorite ? '#EF4444' : isDark ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => addMarker()} className="p-2">
              <MaterialIcons name="bookmark-add" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Font Size Menu */}
        {showFontSizeMenu && (
          <View
            className={`absolute right-4 top-16 z-50 rounded-lg p-2 shadow-lg ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => changeFontSize(size)}
                className={`flex-row items-center rounded p-3 ${
                  fontSize === size ? (isDark ? 'bg-blue-600' : 'bg-blue-100') : ''
                }`}>
                <MaterialIcons
                  name="text-fields"
                  size={size === 'small' ? 16 : size === 'medium' ? 20 : size === 'large' ? 24 : 28}
                  color={
                    fontSize === size
                      ? isDark
                        ? '#FFFFFF'
                        : '#1F2937'
                      : isDark
                        ? '#9CA3AF'
                        : '#6B7280'
                  }
                />
                <Text
                  className={`ml-2 capitalize ${
                    fontSize === size
                      ? isDark
                        ? 'text-white'
                        : 'text-gray-900'
                      : isDark
                        ? 'text-gray-300'
                        : 'text-gray-700'
                  }`}>
                  {size === 'xlarge' ? 'Extra Large' : size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <PanGestureHandler
          onHandlerStateChange={onSwipeGestureEvent}
          activeOffsetX={[-50, 50]}
          failOffsetY={[-20, 20]}
          shouldCancelWhenOutside>
          <View style={{ flex: 1 }} onTouchStart={() => setShowFontSizeMenu(false)}>
            <ScrollView className="flex-1">
              <View className="relative">
                <Image
                  source={imageSource}
                  style={{ width: '100%', height: 200 }}
                  resizeMode="cover"
                />

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
                  className={`${getFontSizeClass()} leading-relaxed ${isDark ? 'text-white' : 'text-gray-800'}`}>
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
                            <Text
                              className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
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
                          <Text
                            className={`mt-1 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {marker.note}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Notes Section */}
            {currentFrame && (
              <NotesSection
                collectionId={collectionId as string}
                storyNumber={parseInt(storyNumber as string, 10)}
                frameNumber={currentFrameNumber}
                isVisible={showComments}
                onToggleVisibility={() => setShowComments(!showComments)}
              />
            )}
          </View>
        </PanGestureHandler>

        {/* Navigation controls */}
        <View
          className={`flex-row items-center justify-between p-4 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <TouchableOpacity
            onPress={goToPreviousFrame}
            disabled={currentFrameNumber <= 1 && !getPreviousStory()}
            className={`rounded-full p-3 ${
              currentFrameNumber <= 1 && !getPreviousStory()
                ? isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
                : currentFrameNumber <= 1 && getPreviousStory()
                  ? isDark
                    ? 'bg-blue-700'
                    : 'bg-blue-700'
                  : isDark
                    ? 'bg-blue-900'
                    : 'bg-blue-500'
            }`}>
            <MaterialIcons
              name={
                currentFrameNumber <= 1 && getPreviousStory()
                  ? 'keyboard-double-arrow-left'
                  : 'chevron-left'
              }
              size={24}
              color={
                currentFrameNumber <= 1 && !getPreviousStory()
                  ? isDark
                    ? '#4B5563'
                    : '#9CA3AF'
                  : '#FFFFFF'
              }
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
            disabled={currentFrameNumber >= totalFrames && !getNextStory()}
            className={`rounded-full p-3 ${
              currentFrameNumber >= totalFrames && !getNextStory()
                ? isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
                : currentFrameNumber >= totalFrames && getNextStory()
                  ? isDark
                    ? 'bg-blue-700'
                    : 'bg-blue-700'
                  : isDark
                    ? 'bg-blue-900'
                    : 'bg-blue-500'
            }`}>
            <MaterialIcons
              name={
                currentFrameNumber >= totalFrames && getNextStory()
                  ? 'keyboard-double-arrow-right'
                  : 'chevron-right'
              }
              size={24}
              color={
                currentFrameNumber >= totalFrames && !getNextStory()
                  ? isDark
                    ? '#4B5563'
                    : '#9CA3AF'
                  : '#FFFFFF'
              }
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
