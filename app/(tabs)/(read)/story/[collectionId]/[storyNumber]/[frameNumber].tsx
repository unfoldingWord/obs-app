import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  ScrollView,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotesSection } from '../../../../../../src/components/CommentsSection';
import { FrameBadge } from '../../../../../../src/components/FrameBadge';
import {
  CollectionsManager,
  Collection,
  Story,
  Frame,
} from '../../../../../../src/core/CollectionsManager';
import { UnifiedLanguagesManager } from '../../../../../../src/core/UnifiedLanguagesManager';
import { StoryManager, UserMarker } from '../../../../../../src/core/storyManager';
import { useObsImage } from '../../../../../../src/hooks/useObsImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [isRTL, setIsRTL] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentFrameNumberRef = useRef(currentFrameNumber);
  const scrollStartOffsetRef = useRef<number>(0);
  const isProgrammaticScrollRef = useRef(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Update the ref whenever currentFrameNumber changes
  useEffect(() => {
    currentFrameNumberRef.current = currentFrameNumber;
  }, [currentFrameNumber]);

  // Debug effect to track frames changes
  useEffect(() => {
    console.log('frames state changed, length:', frames.length);
  }, [frames]);

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
        const frameIndex = frames.findIndex((f) => f.frameNumber === frameNum);
        if (frameIndex !== -1) {
          const frame = frames[frameIndex];
          setCurrentFrame(frame);
        }
      }
    }
  }, [frameNumber, frames]);

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

      // Get language direction
      console.log('Getting language direction for:', collectionDetails.language);
      const languagesManager = UnifiedLanguagesManager.getInstance();
      await languagesManager.initialize();
      const languageData = await languagesManager.getLanguage(collectionDetails.language);
      console.log('Language data:', languageData);
      setIsRTL(languageData?.ld === 'rtl');

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

        // Load initial markers for the frame
        const storyManager = StoryManager.getInstance();
        try {
          const frameMarkers = await storyManager.getMarkersForFrame(
            collectionId as string,
            parseInt(storyNumber as string, 10),
            initialFrame.frameNumber
          );
          setMarkers(frameMarkers);
        } catch (markerError) {
          console.error('Error loading initial markers:', markerError);
        }
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

    // Scroll to the frame in the FlatList
    const frameIndex = frameArray.findIndex((f) => f.frameNumber === safeFrameNumber);
    if (frameIndex !== -1 && flatListRef.current) {
      isProgrammaticScrollRef.current = true;
      flatListRef.current.scrollToIndex({
        index: frameIndex,
        animated: true,
      });
    }

    // Load markers for the new frame
    const loadMarkersForFrame = async () => {
      try {
        const storyManager = StoryManager.getInstance();
        const frameMarkers = await storyManager.getMarkersForFrame(
          collectionId as string,
          parseInt(storyNumber as string, 10),
          safeFrameNumber
        );
        setMarkers(frameMarkers);
      } catch (error) {
        console.error('Error loading markers:', error);
      }
    };
    loadMarkersForFrame();
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const currentIndex = viewableItems[0].index;
        const frame = frames[currentIndex];

        if (frame && frame.frameNumber !== currentFrameNumberRef.current) {
          const newFrameNumber = frame.frameNumber;
          console.log('Frame changed to:', newFrameNumber);

          setCurrentFrame(frame);
          setCurrentFrameNumber(newFrameNumber);

          // Trigger marker loading and progress saving for the new frame
          const loadMarkersForNewFrame = async () => {
            try {
              const storyManager = StoryManager.getInstance();
              const frameMarkers = await storyManager.getMarkersForFrame(
                collectionId as string,
                parseInt(storyNumber as string, 10),
                newFrameNumber
              );
              setMarkers(frameMarkers);

              // Save reading progress for continue reading feature
              await storyManager.saveReadingProgress(
                collectionId as string,
                parseInt(storyNumber as string, 10),
                newFrameNumber,
                totalFrames
              );
            } catch (error) {
              console.error('Error loading markers or saving progress:', error);
            }
          };

          loadMarkersForNewFrame();
        } else if (!frame) {
          console.warn('No frame found for index:', currentIndex);
        }
      }
    },
    [frames, collectionId, storyNumber, totalFrames]
  );

  // Simple boundary detection handlers
  const handleScrollBegin = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    scrollStartOffsetRef.current = contentOffset.x;
  }, []);

  const handleScrollEnd = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      const startOffset = scrollStartOffsetRef.current;
      const endOffset = contentOffset.x;
      const currentFrame = currentFrameNumberRef.current;

      // Ignore boundary detection if this was programmatic scrolling
      if (isProgrammaticScrollRef.current) {
        isProgrammaticScrollRef.current = false;
        return;
      }

      console.log('Scroll debug:', {
        startOffset,
        endOffset,
        currentFrame,
        totalFrames,
        framesLength: frames.length,
        screenWidth: SCREEN_WIDTH,
        isRTL,
      });

      // Simplified boundary detection - let's get basic functionality working first
      const maxOffset = (frames.length - 1) * SCREEN_WIDTH;
      const tolerance = 10;

      // Check if user tried to scroll beyond start (first frame)
      if (currentFrame === 1) {
        const isAtStart = startOffset <= tolerance && endOffset <= tolerance;
        console.log('First frame boundary check:', {
          isAtStart,
          startOffset,
          endOffset,
          tolerance,
        });

        if (isAtStart) {
          console.log('User tried to scroll beyond first frame');
          // Navigate to previous story
          const previousStory = getPreviousStory();
          if (previousStory) {
            navigateToPreviousStoryLastFrame(previousStory);
          }
        }
      }

      // Check if user tried to scroll beyond end (last frame)
      if (currentFrame === totalFrames) {
        const isAtEnd = startOffset >= maxOffset - tolerance && endOffset >= maxOffset - tolerance;
        console.log('Last frame boundary check:', {
          isAtEnd,
          startOffset,
          endOffset,
          maxOffset,
          tolerance,
        });

        if (isAtEnd) {
          console.log('User tried to scroll beyond last frame');
          // Navigate to next story
          const nextStory = getNextStory();
          if (nextStory) {
            console.log(`Navigating to next story ${nextStory.storyNumber}, frame 1`);
            router.push(`/story/${encodeURIComponent(collectionId)}/${nextStory.storyNumber}/1`);
          }
        }
      }
    },
    [frames.length, totalFrames, isRTL]
  );

  const navigateToPreviousStoryLastFrame = async (previousStory: Story) => {
    try {
      const collectionsManager = CollectionsManager.getInstance();
      const previousStoryFrames = await collectionsManager.getStoryFrames(
        collectionId as string,
        previousStory.storyNumber
      );
      const lastFrameNumber = previousStoryFrames.length;
      console.log(
        `Navigating to previous story ${previousStory.storyNumber}, frame ${lastFrameNumber}`
      );
      router.push(
        `/story/${encodeURIComponent(collectionId)}/${previousStory.storyNumber}/${lastFrameNumber}`
      );
    } catch (error) {
      console.error('Error loading previous story frames:', error);
    }
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    waitForInteraction: false,
  }).current;

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

      // Reload markers for current frame
      const frameMarkers = await storyManager.getMarkersForFrame(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        currentFrameNumber
      );
      setMarkers(frameMarkers);
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

  // Individual frame component for horizontal scrolling
  const FrameCard = ({ frame, index }: { frame: Frame; index: number }) => {
    const imageSource = useObsImage({
      reference: {
        story: parseInt(storyNumber as string, 10),
        frame: frame.frameNumber,
      },
    });

    const [frameMarkers, setFrameMarkers] = useState<UserMarker[]>([]);

    useEffect(() => {
      const loadFrameMarkers = async () => {
        if (!collectionId || !storyNumber) return;
        try {
          const storyManager = StoryManager.getInstance();
          const markers = await storyManager.getMarkersForFrame(
            collectionId as string,
            parseInt(storyNumber as string, 10),
            frame.frameNumber
          );
          setFrameMarkers(markers);
        } catch (error) {
          console.error('Error loading frame markers:', error);
        }
      };
      loadFrameMarkers();
    }, [frame.frameNumber]);

    return (
      <View style={{ width: SCREEN_WIDTH }}>
        <ScrollView style={{ flex: 1 }}>
          <View className="relative">
            <Image source={imageSource} style={{ width: '100%', height: 200 }} resizeMode="cover" />

            {/* Markers indicator */}
            {frameMarkers.length > 0 && (
              <View className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'}`}>
                <View
                  className={`flex-row items-center rounded-full px-2 py-1 ${
                    isDark ? 'bg-black/50' : 'bg-white/80'
                  }`}
                  style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <MaterialIcons name="bookmark" size={16} color={isDark ? '#FFD700' : '#F59E0B'} />
                  <Text
                    className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                    style={{
                      marginLeft: isRTL ? 0 : 4,
                      marginRight: isRTL ? 4 : 0,
                    }}>
                    {frameMarkers.length}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View className="p-4">
            <FrameBadge
              storyNumber={parseInt(storyNumber as string, 10)}
              frameNumber={frame.frameNumber}
              isFavorite={frame?.isFavorite}
              isRTL={isRTL}
              size="medium"
            />

            <Text
              className={`${getFontSizeClass()} leading-relaxed ${isDark ? 'text-white' : 'text-gray-800'}`}
              style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {frame.text}
            </Text>

            {/* Display markers if any */}
            {frameMarkers.length > 0 && (
              <View className="mt-4">
                <Text
                  className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  Bookmarks ({frameMarkers.length})
                </Text>
                {frameMarkers.map((marker) => (
                  <View
                    key={marker.id}
                    className={`mb-2 rounded-lg p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <View
                      className="flex-row items-center justify-between"
                      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <View
                        className="flex-1 flex-row items-center"
                        style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <View
                          className="mr-2 h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: marker.color || '#FFD700',
                            marginRight: isRTL ? 0 : 8,
                            marginLeft: isRTL ? 8 : 0,
                          }}
                        />
                        <Text
                          className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                          style={{ textAlign: isRTL ? 'right' : 'left' }}>
                          {new Date(marker.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          const storyManager = StoryManager.getInstance();
                          storyManager.deleteMarker(marker.id).then(() => {
                            // Reload markers for this specific frame
                            const loadFrameMarkers = async () => {
                              if (!collectionId || !storyNumber) return;
                              try {
                                const markers = await storyManager.getMarkersForFrame(
                                  collectionId as string,
                                  parseInt(storyNumber as string, 10),
                                  frame.frameNumber
                                );
                                setFrameMarkers(markers);
                              } catch (error) {
                                console.error('Error loading frame markers:', error);
                              }
                            };
                            loadFrameMarkers();
                          });
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
                        className={`mt-1 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                        style={{ textAlign: isRTL ? 'right' : 'left' }}>
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
    );
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
          } border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <TouchableOpacity
            onPress={() => router.push(`/stories?collection=${encodeURIComponent(collectionId)}`)}
            className="p-2">
            <MaterialIcons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={24}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>

          <Text
            className={`flex-1 text-center text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            style={{ textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 16 }}>
            {story?.title || `Story ${storyNumber}`}
          </Text>

          <View className="flex-row" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
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

        {/* Horizontal Scrolling Frames */}
        <View style={{ flex: 1 }} onTouchStart={() => setShowFontSizeMenu(false)}>
          <FlatList
            ref={flatListRef}
            data={frames}
            renderItem={({ item, index }) => {
              return <FrameCard frame={item} index={index} />;
            }}
            keyExtractor={(item) => `frame-${item.frameNumber}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            style={{ flex: 1 }}
            onScrollBeginDrag={handleScrollBegin}
            onScrollEndDrag={handleScrollEnd}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              console.warn('Failed to scroll to index:', info);
              // Fallback to scroll to beginning
              flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            }}
            initialScrollIndex={Math.max(
              0,
              frames.findIndex((f) => f.frameNumber === currentFrameNumber)
            )}
            inverted={isRTL}
          />

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

        {/* Navigation controls */}
        <View
          className={`flex-row items-center justify-between p-4 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          {/* Previous Button */}
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
                  ? isRTL
                    ? 'keyboard-double-arrow-right'
                    : 'keyboard-double-arrow-left'
                  : isRTL
                    ? 'keyboard-arrow-right'
                    : 'keyboard-arrow-left'
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

          {/* Frame indicators */}
          <View className="flex-row" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            {[...Array(totalFrames)].map((_, index) => {
              const frameNum = index + 1;
              const isActive = frameNum === currentFrameNumber;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => navigateToFrame(frameNum)}
                  className={`mx-1 h-2 w-2 rounded-full ${
                    isActive
                      ? isDark
                        ? 'bg-blue-400'
                        : 'bg-blue-500'
                      : isDark
                        ? 'bg-gray-600'
                        : 'bg-gray-300'
                  }`}
                />
              );
            })}
          </View>

          {/* Next Button */}
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
                  ? isRTL
                    ? 'keyboard-double-arrow-left'
                    : 'keyboard-double-arrow-right'
                  : isRTL
                    ? 'keyboard-arrow-left'
                    : 'keyboard-arrow-right'
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
