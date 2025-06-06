import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

interface BookmarkModalProps {
  visible: boolean;
  onClose: () => void;
  onAddBookmark: (frameNumber: number, note?: string) => void;
  isDark: boolean;
  isRTL: boolean;
  selectedFrame: number;
}

export default function VerticalReadingScreen() {
  const { collectionId: encodedCollectionId, storyNumber, frame } = useLocalSearchParams();
  const collectionId = decodeURIComponent(encodedCollectionId as string);
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRTL, setIsRTL] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [selectedFrameForBookmark, setSelectedFrameForBookmark] = useState<number>(1);
  const [frameMarkers, setFrameMarkers] = useState<Record<number, UserMarker[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [currentVisibleFrame, setCurrentVisibleFrame] = useState<number>(
    frame ? parseInt(frame as string, 10) : 1
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const framePositions = useRef<Record<number, { y: number; height: number }>>({});
  const hasScrolledToInitialFrame = useRef(false);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadStoryData();
    loadFontSizePreference();
  }, [collectionId, storyNumber]);

  const loadStoryData = async () => {
    if (!collectionId || !storyNumber) {
      setError('Collection ID or Story Number is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.initialize();

      // Get collection details
      const collectionDetails = await collectionsManager.getCollection(collectionId as string);
      if (!collectionDetails) {
        setError(`Collection not found: ${collectionId}`);
        setLoading(false);
        return;
      }
      setCollection(collectionDetails);

      // Get all stories in the collection
      const allStoriesData = await collectionsManager.getCollectionStories(collectionId as string);
      setAllStories(allStoriesData.sort((a: Story, b: Story) => a.storyNumber - b.storyNumber));

      // Get language direction
      const languagesManager = UnifiedLanguagesManager.getInstance();
      await languagesManager.initialize();
      const languageData = await languagesManager.getLanguage(collectionDetails.language);
      setIsRTL(languageData?.ld === 'rtl');

      // Get story details
      const storyData = await collectionsManager.getStory(
        collectionId as string,
        parseInt(storyNumber as string, 10)
      );
      if (!storyData) {
        setError(`Story not found: ${storyNumber}`);
        setLoading(false);
        return;
      }
      setStory(storyData);

      // Get story frames
      const storyFrames = await collectionsManager.getStoryFrames(
        collectionId as string,
        parseInt(storyNumber as string, 10)
      );
      if (!storyFrames || storyFrames.length === 0) {
        setError('No frames found for this story');
        setLoading(false);
        return;
      }

      setFrames(storyFrames);

      // Load markers for all frames
      await loadAllMarkers(storyFrames);

      setError(null);
    } catch (err) {
      console.error('Error loading story:', err);
      setError(`Failed to load story: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAllMarkers = async (storyFrames: Frame[]) => {
    try {
      const storyManager = StoryManager.getInstance();
      const markersMap: Record<number, UserMarker[]> = {};

      for (const frame of storyFrames) {
        const markers = await storyManager.getMarkersForFrame(
          collectionId as string,
          parseInt(storyNumber as string, 10),
          frame.frameNumber
        );
        markersMap[frame.frameNumber] = markers;
      }

      setFrameMarkers(markersMap);
    } catch (error) {
      console.error('Error loading markers:', error);
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

  const handleBookmarkPress = (frameNumber: number) => {
    setSelectedFrameForBookmark(frameNumber);
    setShowBookmarkModal(true);
  };

  const addMarker = async (frameNumber: number, note?: string) => {
    if (!collectionId || !storyNumber) return;

    try {
      const storyManager = StoryManager.getInstance();
      await storyManager.addMarker(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        frameNumber,
        note
      );

      // Reload markers for this frame
      const frameMarkers = await storyManager.getMarkersForFrame(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        frameNumber
      );

      setFrameMarkers((prev) => ({
        ...prev,
        [frameNumber]: frameMarkers,
      }));
    } catch (error) {
      console.error('Error adding marker:', error);
    }
  };

  const toggleFavorite = async (frameNumber: number) => {
    if (!collectionId || !storyNumber) return;

    try {
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.toggleFrameFavorite(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        frameNumber
      );

      // Update the frame in our state
      setFrames((prevFrames) =>
        prevFrames.map((frame) =>
          frame.frameNumber === frameNumber ? { ...frame, isFavorite: !frame.isFavorite } : frame
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteMarker = async (markerId: string, frameNumber: number) => {
    try {
      const storyManager = StoryManager.getInstance();
      await storyManager.deleteMarker(markerId);

      // Reload markers for this frame
      const updatedMarkers = await storyManager.getMarkersForFrame(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        frameNumber
      );

      setFrameMarkers((prev) => ({
        ...prev,
        [frameNumber]: updatedMarkers,
      }));
    } catch (error) {
      console.error('Error deleting marker:', error);
    }
  };

  const saveReadingProgress = async (frameNumber: number) => {
    if (!collectionId || !storyNumber) return;

    try {
      const storyManager = StoryManager.getInstance();
      await storyManager.saveReadingProgress(
        collectionId as string,
        parseInt(storyNumber as string, 10),
        frameNumber,
        frames.length
      );
    } catch (err) {
      console.error('Error saving reading progress:', err);
    }
  };

  const scrollToFrame = (frameNumber: number) => {
    const position = framePositions.current[frameNumber];
    if (position && scrollViewRef.current) {
      // Account for header height + some padding to position frame right below header
      // Header has py-3 (24px total) + content (~40px) + border + safe area offset
      const headerOffset = 80; // Increased offset to account for full header height
      scrollViewRef.current.scrollTo({
        y: Math.max(0, position.y - headerOffset),
        animated: true,
      });
      setCurrentVisibleFrame(frameNumber);
      saveReadingProgress(frameNumber);
    }
  };

  // Effect to scroll to initial frame when positions are ready
  useEffect(() => {
    if (!loading && frames.length > 0 && !hasScrolledToInitialFrame.current && frame) {
      const targetFrame = parseInt(frame as string, 10);
      if (targetFrame > 1 && targetFrame <= frames.length) {
        // Wait a bit for layout to complete, then scroll
        const scrollTimer = setTimeout(() => {
          scrollToFrame(targetFrame);
          hasScrolledToInitialFrame.current = true;
        }, 300);
        return () => clearTimeout(scrollTimer);
      } else {
        hasScrolledToInitialFrame.current = true;
      }
    }
  }, [loading, frames.length, frame, scrollToFrame]);

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      const scrollY = contentOffset.y;

      // Find which frame is currently most visible based on scroll position
      let currentFrame = 1;
      const viewportCenter = scrollY + 200; // Add some offset for better UX

      for (const frame of frames) {
        const position = framePositions.current[frame.frameNumber];
        if (position) {
          const frameCenter = position.y + position.height / 2;
          if (viewportCenter >= position.y && viewportCenter <= position.y + position.height) {
            currentFrame = frame.frameNumber;
            break;
          } else if (viewportCenter > frameCenter) {
            currentFrame = frame.frameNumber;
          }
        }
      }

      if (currentFrame !== currentVisibleFrame) {
        setCurrentVisibleFrame(currentFrame);
        saveReadingProgress(currentFrame);
      }
    },
    [frames, currentVisibleFrame]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStoryData();
    setRefreshing(false);
  }, []);

  const getNextStory = (): Story | null => {
    if (!allStories || !storyNumber) return null;
    const currentStoryNum = parseInt(storyNumber as string, 10);
    const currentIndex = allStories.findIndex((story) => story.storyNumber === currentStoryNum);
    if (currentIndex === -1 || currentIndex === allStories.length - 1) {
      return null;
    }
    return allStories[currentIndex + 1];
  };

  const getPreviousStory = (): Story | null => {
    if (!allStories || !storyNumber) return null;
    const currentStoryNum = parseInt(storyNumber as string, 10);
    const currentIndex = allStories.findIndex((story) => story.storyNumber === currentStoryNum);
    if (currentIndex === -1 || currentIndex === 0) {
      return null;
    }
    return allStories[currentIndex - 1];
  };

  const navigateToNextStory = () => {
    const nextStory = getNextStory();
    if (nextStory) {
      router.replace(
        `/story/${encodeURIComponent(collectionId)}/${nextStory.storyNumber}/vertical`
      );
    }
  };

  const navigateToPreviousStory = () => {
    const previousStory = getPreviousStory();
    if (previousStory) {
      router.replace(
        `/story/${encodeURIComponent(collectionId)}/${previousStory.storyNumber}/vertical`
      );
    }
  };

  const FrameCard = ({ frame }: { frame: Frame }) => {
    const imageSource = useObsImage({
      reference: {
        story: parseInt(storyNumber as string, 10),
        frame: frame.frameNumber,
      },
    });

    const markers = frameMarkers[frame.frameNumber] || [];

    const handleLayout = (event: any) => {
      const { y, height } = event.nativeEvent.layout;
      framePositions.current[frame.frameNumber] = { y, height };
    };

    return (
      <View
        className={`mx-4 mb-6 overflow-hidden rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        onLayout={handleLayout}>
        <View className="relative">
          <Image source={imageSource} style={{ width: '100%', height: 200 }} resizeMode="cover" />

          {/* Frame number badge */}
          <View className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'}`}>
            <FrameBadge
              storyNumber={parseInt(storyNumber as string, 10)}
              frameNumber={frame.frameNumber}
              isRTL={isRTL}
            />
          </View>

          {/* Markers indicator */}
          {markers.length > 0 && (
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
                  {markers.length}
                </Text>
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View className={`absolute bottom-3 ${isRTL ? 'left-3' : 'right-3'}`}>
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                gap: 8,
              }}>
              <TouchableOpacity
                onPress={() => handleBookmarkPress(frame.frameNumber)}
                className={`rounded-full p-2 ${isDark ? 'bg-black/70' : 'bg-white/90'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <MaterialIcons
                  name={markers.length > 0 ? 'bookmark' : 'bookmark-border'}
                  size={20}
                  color={markers.length > 0 ? '#F59E0B' : isDark ? '#9CA3AF' : '#6B7280'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleFavorite(frame.frameNumber)}
                className={`rounded-full p-2 ${isDark ? 'bg-black/70' : 'bg-white/90'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <MaterialIcons
                  name={frame.isFavorite ? 'favorite' : 'favorite-border'}
                  size={20}
                  color={frame.isFavorite ? '#EF4444' : isDark ? '#9CA3AF' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="p-4">
          <Text
            className={`${getFontSizeClass()} leading-relaxed ${isDark ? 'text-white' : 'text-gray-800'}`}
            style={{ textAlign: isRTL ? 'right' : 'left' }}>
            {frame.text}
          </Text>

          {/* Display markers */}
          {markers.length > 0 && (
            <View className="mt-4">
              {markers.map((marker) => (
                <View
                  key={marker.id}
                  className={`mb-3 rounded-2xl p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
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
                      onPress={() => deleteMarker(marker.id, frame.frameNumber)}
                      className={`rounded-full p-2 ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
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
      </View>
    );
  };

  const BookmarkModal: React.FC<BookmarkModalProps> = ({
    visible,
    onClose,
    onAddBookmark,
    isDark,
    isRTL,
    selectedFrame,
  }) => {
    const [bookmarkName, setBookmarkName] = useState('');

    const handleAddBookmark = () => {
      onAddBookmark(selectedFrame, bookmarkName.trim() || undefined);
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

  if (error || !frames.length) {
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
          <Text className={`mt-4 text-center text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {error || 'No frames found'}
          </Text>
          <TouchableOpacity
            className={`mt-8 rounded-xl px-6 py-3 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg`}
            onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        className={`border-b px-4 py-3 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}
        style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.push(`/stories?collectionId=${encodeURIComponent(collectionId)}`)}
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
            onPress={() => {
              // Save horizontal mode preference and navigate to horizontal
              AsyncStorage.setItem('readingModePreference', 'horizontal').catch(console.error);
              router.replace(
                `/story/${encodeURIComponent(collectionId)}/${storyNumber}/${currentVisibleFrame}`
              );
            }}
            className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <MaterialIcons name="view-carousel" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Font Size Menu */}
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

      {/* Vertical Scrolling Content */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onTouchStart={() => setShowFontSizeMenu(false)}>
        {/* Story navigation header */}
        {getPreviousStory() && (
          <TouchableOpacity
            onPress={navigateToPreviousStory}
            className={`mx-4 mb-2 mt-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}>
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 12,
              }}>
              <MaterialIcons
                name={isRTL ? 'arrow-forward' : 'arrow-back'}
                size={24}
                color={isDark ? '#60A5FA' : '#3B82F6'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                  numberOfLines={2}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {getPreviousStory()?.title}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Frames */}
        <View className="py-4">
          {frames.map((frame) => (
            <FrameCard key={frame.frameNumber} frame={frame} />
          ))}
        </View>

        {/* Story navigation footer */}
        {getNextStory() && (
          <TouchableOpacity
            onPress={navigateToNextStory}
            className={`mx-4 mb-4 mt-2 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}>
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 12,
              }}>
              <MaterialIcons
                name={isRTL ? 'arrow-back' : 'arrow-forward'}
                size={24}
                color={isDark ? '#60A5FA' : '#3B82F6'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                  numberOfLines={2}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {getNextStory()?.title}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Bookmark Modal */}
      <BookmarkModal
        visible={showBookmarkModal}
        onClose={() => setShowBookmarkModal(false)}
        onAddBookmark={addMarker}
        isDark={isDark}
        isRTL={isRTL}
        selectedFrame={selectedFrameForBookmark}
      />
    </SafeAreaView>
  );
}
