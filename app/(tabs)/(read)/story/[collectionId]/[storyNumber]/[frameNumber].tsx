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
  Modal,
  TextInput,
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

// Icon-based Bookmark Naming Modal
interface BookmarkModalProps {
  visible: boolean;
  onClose: () => void;
  onAddBookmark: (note?: string) => void;
  isDark: boolean;
  isRTL: boolean;
}

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
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [isRTL, setIsRTL] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [auxiliaryFrames, setAuxiliaryFrames] = useState<Frame[]>([]);
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

  // Create auxiliary frames for boundary detection - simplified approach
  const createAuxiliaryFrames = useCallback(
    (realFrames: Frame[]) => {
      if (!realFrames || realFrames.length === 0) return realFrames;

      const auxiliaryArray: Frame[] = [];

      // Add dummy "previous story" frame at the beginning
      const previousStory = getPreviousStory();
      if (previousStory) {
        auxiliaryArray.push({
          ...realFrames[0], // Copy structure from first real frame
          frameNumber: -1, // Special marker for previous story
          text: `${previousStory.title}`,
          isAuxiliary: true,
          auxiliaryType: 'previous',
        } as Frame & { isAuxiliary: boolean; auxiliaryType: string });
      }

      // Add all real frames
      auxiliaryArray.push(...realFrames);

      // Add dummy "next story" frame at the end
      const nextStory = getNextStory();
      if (nextStory) {
        auxiliaryArray.push({
          ...realFrames[realFrames.length - 1], // Copy structure from last real frame
          frameNumber: realFrames.length + 1, // Special marker for next story
          text: `${nextStory.title}`,
          isAuxiliary: true,
          auxiliaryType: 'next',
        } as Frame & { isAuxiliary: boolean; auxiliaryType: string });
      }

      return auxiliaryArray;
    },
    [allStories, storyNumber]
  );

  // Ensure auxiliary frames are always updated when frames or story context changes
  useEffect(() => {
    if (frames.length > 0 && allStories.length > 0) {
      const auxiliaryFrameArray = createAuxiliaryFrames(frames);
      setAuxiliaryFrames(auxiliaryFrameArray);
      console.log('Auxiliary frames updated:', auxiliaryFrameArray.length, 'total frames');
    }
  }, [frames, allStories, createAuxiliaryFrames]);

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

    // Load markers and save progress for the new frame
    const loadMarkersAndSaveProgress = async () => {
      try {
        const storyManager = StoryManager.getInstance();

        // Load markers for the new frame
        const frameMarkers = await storyManager.getMarkersForFrame(
          collectionId as string,
          parseInt(storyNumber as string, 10),
          safeFrameNumber
        );
        setMarkers(frameMarkers);

        // Save reading progress for continue reading feature
        await storyManager.saveReadingProgress(
          collectionId as string,
          parseInt(storyNumber as string, 10),
          safeFrameNumber,
          totalFrames
        );
      } catch (error) {
        console.error('Error loading markers or saving progress:', error);
      }
    };
    loadMarkersAndSaveProgress();
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const currentIndex = viewableItems[0].index;
        const frame = auxiliaryFrames[currentIndex];

        // Check if this is an auxiliary frame for boundary detection
        if (frame && (frame as any).isAuxiliary) {
          const auxiliaryFrame = frame as Frame & { isAuxiliary: boolean; auxiliaryType: string };

          console.log('🚀 AUXILIARY FRAME DETECTED:', auxiliaryFrame.auxiliaryType);

          if (auxiliaryFrame.auxiliaryType === 'previous') {
            const previousStory = getPreviousStory();
            if (previousStory) {
              console.log('Navigating to previous story last frame');
              navigateToPreviousStoryLastFrame(previousStory);
            }
          } else if (auxiliaryFrame.auxiliaryType === 'next') {
            const nextStory = getNextStory();
            if (nextStory) {
              console.log('Navigating to next story first frame');
              router.push(`/story/${encodeURIComponent(collectionId)}/${nextStory.storyNumber}/1`);
            }
          }
          return; // Don't process auxiliary frames as regular frames
        }

        // Process regular frames
        if (frame && frame.frameNumber !== currentFrameNumberRef.current && frame.frameNumber > 0) {
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
    [auxiliaryFrames, collectionId, storyNumber, totalFrames]
  );

  // Simple boundary detection using FlatList's built-in callbacks
  const handleEndReached = useCallback(() => {
    const currentFrame = currentFrameNumberRef.current;

    console.log('🚀 END REACHED!', {
      currentFrame,
      totalFrames,
      isLastFrame: currentFrame === totalFrames,
    });

    // Only trigger if we're actually on the last frame
    if (currentFrame === totalFrames) {
      console.log('🚀 END: User reached end, navigating to next story');
      const nextStory = getNextStory();
      if (nextStory) {
        router.push(`/story/${encodeURIComponent(collectionId)}/${nextStory.storyNumber}/1`);
      }
    }
  }, [currentFrameNumberRef.current, totalFrames]);

  // For start boundary, we'll use a simple scroll check since onStartReached doesn't exist
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

      // Only check start boundary (left side)
      if (currentFrame === 1 && endOffset <= 20 && startOffset > endOffset) {
        console.log('🚀 START: User tried to scroll beyond first frame');
        const previousStory = getPreviousStory();
        if (previousStory) {
          navigateToPreviousStoryLastFrame(previousStory);
        }
      }
    },
    [totalFrames]
  );

  const handleRefresh = useCallback(async () => {
    const currentFrame = currentFrameNumberRef.current;

    console.log('🔄 REFRESH TRIGGERED!', {
      currentFrame,
      totalFrames,
      isFirstFrame: currentFrame === 1,
    });

    // Only handle refresh on first frame (attempt to go to previous story)
    if (currentFrame === 1) {
      console.log('🚀 REFRESH: User tried to scroll beyond first frame');
      const previousStory = getPreviousStory();
      if (previousStory) {
        setIsRefreshing(true);
        try {
          await navigateToPreviousStoryLastFrame(previousStory);
        } finally {
          setIsRefreshing(false);
        }
      } else {
        // No previous story, just reset refresh state
        setIsRefreshing(false);
      }
    } else {
      // Not on first frame, just reset refresh state
      setIsRefreshing(false);
    }
  }, [currentFrameNumberRef.current, totalFrames]);

  const handleMomentumScrollBegin = useCallback(
    (event: any) => {
      const { contentOffset, velocity } = event.nativeEvent;
      const currentFrame = currentFrameNumberRef.current;

      // Ignore boundary detection if this was programmatic scrolling
      if (isProgrammaticScrollRef.current) {
        return;
      }

      const maxOffset = (frames.length - 1) * SCREEN_WIDTH;
      const velocityThreshold = 0.3; // Lower threshold since we're capturing during momentum

      console.log('=== MOMENTUM SCROLL DEBUG START ===');
      console.log('Momentum values:', {
        endOffset: contentOffset.x,
        velocity: velocity?.x || 0,
        currentFrame,
        totalFrames,
        framesLength: frames.length,
        screenWidth: SCREEN_WIDTH,
        maxOffset,
        isRTL,
      });

      // Check if user tried to scroll beyond end (last frame)
      if (currentFrame === totalFrames) {
        const isAtRightBoundary = contentOffset.x >= maxOffset - 20;
        const hasRightwardVelocity = (velocity?.x || 0) > velocityThreshold;

        console.log('Last frame momentum check:', {
          isAtRightBoundary,
          hasRightwardVelocity,
          velocity: velocity?.x || 0,
          endOffset: contentOffset.x,
          maxOffset,
          velocityThreshold,
        });

        if (isAtRightBoundary && hasRightwardVelocity) {
          console.log('🚀 MOMENTUM TRIGGERING: User tried to scroll beyond last frame');
          const nextStory = getNextStory();
          if (nextStory) {
            console.log(`Navigating to next story ${nextStory.storyNumber}, frame 1`);
            router.push(`/story/${encodeURIComponent(collectionId)}/${nextStory.storyNumber}/1`);
          }
        }
      }

      console.log('=== MOMENTUM SCROLL DEBUG END ===');
    },
    [frames.length, totalFrames, isRTL]
  );

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      const currentFrame = currentFrameNumberRef.current;

      // Ignore boundary detection if this was programmatic scrolling
      if (isProgrammaticScrollRef.current) {
        return;
      }

      // Simple boundary detection for first frame (left boundary)
      if (currentFrame === 1) {
        // If user is trying to scroll to negative offset (beyond first frame)
        if (contentOffset.x < -30) {
          console.log('🚀 SCROLL: User tried to scroll beyond first frame', {
            currentFrame,
            contentOffsetX: contentOffset.x,
          });

          const previousStory = getPreviousStory();
          if (previousStory) {
            // Prevent multiple triggers
            isProgrammaticScrollRef.current = true;
            navigateToPreviousStoryLastFrame(previousStory);
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
          // Update the current frame
          setCurrentFrame(updatedFrame);

          // Update the frames array to maintain state across navigation
          setFrames(prevFrames =>
            prevFrames.map(frame =>
              frame.frameNumber === currentFrameNumber
                ? { ...frame, isFavorite: updatedFrame.isFavorite }
                : frame
            )
          );

          // Update auxiliary frames array as well
          setAuxiliaryFrames(prevAuxFrames =>
            prevAuxFrames.map(frame =>
              frame.frameNumber === currentFrameNumber
                ? { ...frame, isFavorite: updatedFrame.isFavorite }
                : frame
            )
          );
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

  const handleBookmarkPress = () => {
    setShowBookmarkModal(true);
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

  const goToNextFrame = async () => {
    if (currentFrameNumber < totalFrames) {
      navigateToFrame(currentFrameNumber + 1);
    } else {
      // On last frame, save progress before going to next story
      try {
        await saveReadingProgress();
      } catch (error) {
        console.error('Error saving progress before next story:', error);
      }

      // Try to go to next story
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
      // On first frame, save progress before going to previous story
      try {
        await saveReadingProgress();
      } catch (error) {
        console.error('Error saving progress before previous story:', error);
      }

      // Try to go to previous story's last frame
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
    // Always call hooks at the top, regardless of frame type
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

    const auxiliaryFrame = frame as Frame & { isAuxiliary?: boolean; auxiliaryType?: string };

    // Handle auxiliary frames
    if (auxiliaryFrame.isAuxiliary) {
      return (
        <View style={{ width: SCREEN_WIDTH }}>
          <View
            className={`flex-1 items-center justify-center p-8 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <MaterialIcons
              name={
                auxiliaryFrame.auxiliaryType === 'previous'
                  ? isRTL
                    ? 'arrow-forward'
                    : 'arrow-back'
                  : isRTL
                    ? 'arrow-back'
                    : 'arrow-forward'
              }
              size={48}
              color={isDark ? '#60A5FA' : '#3B82F6'}
            />
            <Text
              className={`mt-4 text-center text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {auxiliaryFrame.text}
            </Text>
          </View>
        </View>
      );
    }

    // Handle regular frames
    return (
      <View style={{ width: SCREEN_WIDTH }}>
        <ScrollView style={{ flex: 1 }}>
          <View className="relative">
            <Image source={imageSource} style={{ width: '100%', height: 200 }} resizeMode="cover" />

            {/* Markers indicator */}
            {frameMarkers.length > 0 && (
              <View className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'}`}>
                <View
                  className={`rounded-full px-2.5 py-1.5 ${isDark ? 'bg-black/70' : 'bg-white/90'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                  <MaterialIcons name="bookmark" size={16} color={isDark ? '#FFD700' : '#F59E0B'} />
                  <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {frameMarkers.length}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View className="p-4">
            <Text
              className={`${getFontSizeClass()} leading-relaxed ${isDark ? 'text-white' : 'text-gray-800'}`}
              style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {frame.text}
            </Text>

            {/* Display markers if any */}
            {frameMarkers.length > 0 && (
              <View className="mt-6">
                {frameMarkers.map((marker) => (
                  <View
                    key={marker.id}
                    className={`mb-3 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <View
                      style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                      <View
                        style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          flex: 1,
                          gap: 8,
                        }}>
                        <View
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: marker.color || '#FFD700' }}
                        />
                        <Text
                          className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                        className={`rounded-full p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <MaterialIcons
                          name="delete"
                          size={16}
                          color={isDark ? '#EF4444' : '#DC2626'}
                        />
                      </TouchableOpacity>
                    </View>
                    {marker.note && (
                      <Text
                        className={`mt-3 text-sm ${isDark ? 'text-white' : 'text-gray-900'} leading-relaxed`}
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

  const BookmarkModal: React.FC<BookmarkModalProps> = ({
    visible,
    onClose,
    onAddBookmark,
    isDark,
    isRTL,
  }) => {
    const [bookmarkName, setBookmarkName] = useState('');

    const handleAddBookmark = () => {
      onAddBookmark(bookmarkName.trim() || undefined);
      setBookmarkName('');
      onClose();
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View
            className={`mx-6 w-80 overflow-hidden rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-2xl ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Header */}
            <View className="items-center p-6">
              <View
                className={`mb-4 rounded-full p-4 ${isDark ? 'bg-yellow-600/20' : 'bg-yellow-500/10'} border ${isDark ? 'border-yellow-600/30' : 'border-yellow-500/20'}`}>
                <MaterialIcons
                  name="bookmark-add"
                  size={32}
                  color={isDark ? '#FCD34D' : '#F59E0B'}
                />
              </View>
            </View>

            {/* Input Section */}
            <View className="px-6 pb-4">
              <TextInput
                value={bookmarkName}
                onChangeText={setBookmarkName}
                className={`rounded-2xl px-4 py-3 text-base ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'} border`}
                style={{ textAlign: isRTL ? 'right' : 'left' }}
                multiline
                maxLength={100}
                autoFocus={false}
              />
            </View>

            {/* Action buttons */}
            <View
              className="flex-row border-t"
              style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
              {/* Cancel button */}
              <TouchableOpacity
                onPress={onClose}
                className={`flex-1 items-center justify-center py-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                style={{ borderRightWidth: 1, borderRightColor: isDark ? '#374151' : '#E5E7EB' }}>
                <MaterialIcons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>

              {/* Add bookmark button */}
              <TouchableOpacity
                onPress={handleAddBookmark}
                className="flex-1 items-center justify-center py-4">
                <MaterialIcons
                  name="bookmark-add"
                  size={24}
                  color={isDark ? '#FCD34D' : '#F59E0B'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
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
          <View className="mt-6 items-center">
            <MaterialIcons name="auto-stories" size={64} color={isDark ? '#4B5563' : '#9CA3AF'} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !currentFrame) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
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
          <MaterialIcons name="error-outline" size={80} color={isDark ? '#F87171' : '#EF4444'} />
          <TouchableOpacity
            className={`mt-8 rounded-xl px-6 py-3 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg`}
            onPress={() => router.back()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="arrow-back" size={18} color="white" />
              <Text className="font-semibold text-white">Back</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Modern Header */}
        <View
          className={`border-b px-4 py-3 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push(`/stories?collection=${encodeURIComponent(collectionId)}`)}
            className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <MaterialIcons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={20}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
              style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {story?.title || `Story ${storyNumber}`}
            </Text>
          </View>

          <View
            style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowFontSizeMenu(!showFontSizeMenu)}
              className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <MaterialIcons name="text-fields" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBookmarkPress}
              className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <MaterialIcons
                name={markers.length > 0 ? 'bookmark' : 'bookmark-border'}
                size={20}
                color={markers.length > 0 ? '#F59E0B' : isDark ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleFavorite}
              className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <MaterialIcons
                name={currentFrame?.isFavorite ? 'favorite' : 'favorite-border'}
                size={20}
                color={currentFrame?.isFavorite ? '#EF4444' : isDark ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Modern Font Size Menu */}
        {showFontSizeMenu && (
          <View
            className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-20 z-50 rounded-2xl border p-2 shadow-lg ${
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'
            }`}>
            {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => changeFontSize(size)}
                className={`mb-1 rounded-xl p-3 ${
                  fontSize === size ? (isDark ? 'bg-blue-600' : 'bg-blue-50') : ''
                }`}>
                <MaterialIcons
                  name="text-fields"
                  size={size === 'small' ? 16 : size === 'medium' ? 20 : size === 'large' ? 24 : 28}
                  color={
                    fontSize === size
                      ? isDark
                        ? '#FFFFFF'
                        : '#3B82F6'
                      : isDark
                        ? '#9CA3AF'
                        : '#6B7280'
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Horizontal Scrolling Frames */}
        <View style={{ flex: 1 }} onTouchStart={() => setShowFontSizeMenu(false)}>
          <FlatList
            ref={flatListRef}
            data={auxiliaryFrames}
            renderItem={({ item, index }) => {
              return <FrameCard frame={item} index={index} />;
            }}
            keyExtractor={(item, index) => `frame-${item.frameNumber}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            style={{ flex: 1 }}
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
              auxiliaryFrames.findIndex((f) => f.frameNumber === currentFrameNumber)
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

        {/* Modern Navigation Footer */}
        <View
          className={`border-t px-4 py-3 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {/* Previous Button */}
          <TouchableOpacity
            onPress={goToPreviousFrame}
            disabled={currentFrameNumber <= 1 && !getPreviousStory()}
            className={`rounded-xl p-3 ${
              currentFrameNumber <= 1 && !getPreviousStory()
                ? isDark
                  ? 'bg-gray-800'
                  : 'bg-gray-200'
                : isDark
                  ? 'bg-blue-600'
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

          {/* Frame Progress Indicators */}
          <View
            className="flex-1 items-center"
            style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center' }}>
            <View
              className={`rounded-full border px-4 py-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="auto-stories" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {parseInt(storyNumber as string, 10)}:{currentFrameNumber}
              </Text>
            </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={goToNextFrame}
            disabled={currentFrameNumber >= totalFrames && !getNextStory()}
            className={`rounded-xl p-3 ${
              currentFrameNumber >= totalFrames && !getNextStory()
                ? isDark
                  ? 'bg-gray-800'
                  : 'bg-gray-200'
                : isDark
                  ? 'bg-blue-600'
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

        {/* Bookmark Modal */}
        <BookmarkModal
          visible={showBookmarkModal}
          onClose={() => setShowBookmarkModal(false)}
          onAddBookmark={addMarker}
          isDark={isDark}
          isRTL={isRTL}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
