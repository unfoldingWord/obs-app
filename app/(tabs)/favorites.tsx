import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FrameBadge } from '@/components/FrameBadge';
import { CollectionsManager, Story, Frame } from '@/core/CollectionsManager';
import { CommentsManager, FrameComment } from '@/core/CommentsManager';
import { UnifiedLanguagesManager } from '@/core/UnifiedLanguagesManager';
import { StoryManager, UserMarker } from '@/core/storyManager';
import { useObsImage } from '@/hooks/useObsImage';
import { useStoryNavigation } from '@/hooks/useStoryNavigation';

interface FavoriteStory extends Story {
  collectionDisplayName?: string;
  isRTL?: boolean;
}

interface FavoriteFrame extends Frame {
  storyTitle?: string;
  collectionDisplayName?: string;
  isRTL?: boolean;
}

interface FavoriteMarker extends UserMarker {
  storyTitle?: string;
  collectionDisplayName?: string;
  isRTL?: boolean;
}

interface FavoriteComment extends FrameComment {
  storyTitle?: string;
  collectionDisplayName?: string;
  isRTL?: boolean;
}

export default function FavoritesScreen() {
  const [activeTab, setActiveTab] = useState<'favorites' | 'markers' | 'comments'>('favorites');
  const [loading, setLoading] = useState(true);
  const [favoriteStories, setFavoriteStories] = useState<FavoriteStory[]>([]);
  const [favoriteFrames, setFavoriteFrames] = useState<FavoriteFrame[]>([]);
  const [markers, setMarkers] = useState<FavoriteMarker[]>([]);
  const [comments, setComments] = useState<FavoriteComment[]>([]);
  const { navigateToStory, navigateToStoryStart } = useStoryNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Combine and sort favorites by timestamp (most recent first)
  const combinedFavorites = [
    ...favoriteStories.map((story) => ({ ...story, type: 'story' as const })),
    ...favoriteFrames.map((frame) => ({ ...frame, type: 'frame' as const })),
  ].sort((a, b) => {
    // Sort by most recently added (you might need to add timestamps to your data)
    return 0; // For now, keep original order
  });

  const loadFavoritesData = useCallback(async () => {
    try {
      setLoading(true);
      const collectionsManager = CollectionsManager.getInstance();
      const storyManager = StoryManager.getInstance();
      const languagesManager = UnifiedLanguagesManager.getInstance();

      await collectionsManager.initialize();
      await storyManager.initialize();
      await languagesManager.initialize();

      // Load favorite stories
      const favStories = await collectionsManager.getFavoriteStories();
      const storiesWithThumbnails = await Promise.all(
        favStories.map(async (story) => {
          const collection = await collectionsManager.getCollection(story.collectionId);
          const languageData = collection
            ? await languagesManager.getLanguage(collection.language)
            : null;
          return {
            ...story,
            collectionDisplayName: collection?.displayName || story.collectionId,
            isRTL: languageData?.ld === 'rtl',
          };
        })
      );
      setFavoriteStories(storiesWithThumbnails);

      // Load favorite frames with story titles
      const favFrames = await collectionsManager.getFavoriteFrames();
      const framesWithTitles = await Promise.all(
        favFrames.map(async (frame) => {
          const story = await collectionsManager.getStory(frame.collectionId, frame.storyNumber);
          const collection = await collectionsManager.getCollection(frame.collectionId);
          const languageData = collection
            ? await languagesManager.getLanguage(collection.language)
            : null;
          return {
            ...frame,
            storyTitle: story?.title || `Story ${frame.storyNumber}`,
            collectionDisplayName: collection?.displayName || frame.collectionId,
            isRTL: languageData?.ld === 'rtl',
          };
        })
      );
      setFavoriteFrames(framesWithTitles);

      // Load all markers with story titles
      const allMarkers = await storyManager.getAllMarkers();
      const markersWithTitles = await Promise.all(
        allMarkers.map(async (marker) => {
          const story = await collectionsManager.getStory(marker.collectionId, marker.storyNumber);
          const collection = await collectionsManager.getCollection(marker.collectionId);
          const languageData = collection
            ? await languagesManager.getLanguage(collection.language)
            : null;
          return {
            ...marker,
            storyTitle: story?.title || `Story ${marker.storyNumber}`,
            collectionDisplayName: collection?.displayName || marker.collectionId,
            isRTL: languageData?.ld === 'rtl',
          };
        })
      );
      setMarkers(markersWithTitles);

      // Load all comments with story titles
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.initialize();
      const allComments = await commentsManager.getAllComments();
      const commentsWithTitles = await Promise.all(
        allComments.map(async (comment) => {
          const story = await collectionsManager.getStory(
            comment.collectionId,
            comment.storyNumber
          );
          const collection = await collectionsManager.getCollection(comment.collectionId);
          const languageData = collection
            ? await languagesManager.getLanguage(collection.language)
            : null;
          return {
            ...comment,
            storyTitle: story?.title || `Story ${comment.storyNumber}`,
            collectionDisplayName: collection?.displayName || comment.collectionId,
            isRTL: languageData?.ld === 'rtl',
          };
        })
      );
      setComments(commentsWithTitles);
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
      const languagesManager = UnifiedLanguagesManager.getInstance();

      await collectionsManager.initialize();
      await storyManager.initialize();
      await languagesManager.initialize();

      // Load favorite stories
      const favStories = await collectionsManager.getFavoriteStories();
      const storiesWithThumbnails = await Promise.all(
        favStories.map(async (story) => {
          const collection = await collectionsManager.getCollection(story.collectionId);
          const languageData = collection
            ? await languagesManager.getLanguage(collection.language)
            : null;
          return {
            ...story,
            collectionDisplayName: collection?.displayName || story.collectionId,
            isRTL: languageData?.ld === 'rtl',
          };
        })
      );
      setFavoriteStories(storiesWithThumbnails);

      // Load favorite frames with story titles
      const favFrames = await collectionsManager.getFavoriteFrames();
      const framesWithTitles = await Promise.all(
        favFrames.map(async (frame) => {
          const story = await collectionsManager.getStory(frame.collectionId, frame.storyNumber);
          const collection = await collectionsManager.getCollection(frame.collectionId);
          const languageData = collection
            ? await languagesManager.getLanguage(collection.language)
            : null;
          return {
            ...frame,
            storyTitle: story?.title || `Story ${frame.storyNumber}`,
            collectionDisplayName: collection?.displayName || frame.collectionId,
            isRTL: languageData?.ld === 'rtl',
          };
        })
      );
      setFavoriteFrames(framesWithTitles);

      // Load all markers with story titles
      const allMarkers = await storyManager.getAllMarkers();
      const markersWithTitles = await Promise.all(
        allMarkers.map(async (marker) => {
          const story = await collectionsManager.getStory(marker.collectionId, marker.storyNumber);
          const collection = await collectionsManager.getCollection(marker.collectionId);
          const languageData = collection
            ? await languagesManager.getLanguage(collection.language)
            : null;
          return {
            ...marker,
            storyTitle: story?.title || `Story ${marker.storyNumber}`,
            collectionDisplayName: collection?.displayName || marker.collectionId,
            isRTL: languageData?.ld === 'rtl',
          };
        })
      );
      setMarkers(markersWithTitles);

      // Load all comments with story titles
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.initialize();
      const allComments = await commentsManager.getAllComments();
      const commentsWithTitles = await Promise.all(
        allComments.map(async (comment) => {
          const story = await collectionsManager.getStory(
            comment.collectionId,
            comment.storyNumber
          );
          const collection = await collectionsManager.getCollection(comment.collectionId);
          const languageData = collection
            ? await languagesManager.getLanguage(collection.language)
            : null;
          return {
            ...comment,
            storyTitle: story?.title || `Story ${comment.storyNumber}`,
            collectionDisplayName: collection?.displayName || comment.collectionId,
            isRTL: languageData?.ld === 'rtl',
          };
        })
      );
      setComments(commentsWithTitles);
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

  const navigateToFavoriteStory = (story: FavoriteStory) => {
    navigateToStoryStart(story.collectionId, story.storyNumber);
  };

  const navigateToFrame = (frame: Frame) => {
    navigateToStory(frame.collectionId, frame.storyNumber, frame.frameNumber);
  };

  const navigateToMarker = (marker: UserMarker) => {
    navigateToStory(marker.collectionId, marker.storyNumber, marker.frameNumber);
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

  const navigateToComment = (comment: FavoriteComment) => {
    navigateToStory(comment.collectionId, comment.storyNumber, comment.frameNumber);
  };

  const deleteComment = async (commentId: string) => {
    try {
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.deleteComment(commentId);
      await loadFavoritesData(); // Reload data
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const FavoriteStoryThumbnail = ({ storyNumber }: { storyNumber: number }) => {
    const thumbnailImage = useObsImage({
      reference: {
        story: storyNumber,
        frame: 1, // Always use the first frame for thumbnail
      },
    });

    return <Image source={thumbnailImage} className="h-48 w-full" resizeMode="cover" />;
  };

  const renderFavoriteStory = ({ item }: { item: FavoriteStory }) => {
    const sourceReference = item.metadata?.sourceReference;

    return (
      <TouchableOpacity
        onPress={() => navigateToFavoriteStory(item)}
        className={`mx-4 mb-6 overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <View className="relative">
          <FavoriteStoryThumbnail storyNumber={item.storyNumber} />
          {/* Story badge with icon and number */}
          <View
            className={`absolute top-3 ${item.isRTL ? 'left-3' : 'right-3'} flex-row items-center rounded-full px-3 py-2 ${isDark ? 'bg-blue-600/90' : 'bg-blue-500/90'}`}>
            <MaterialIcons name="menu-book" size={16} color="#FFFFFF" />
            <Text className="ml-1 text-sm font-bold text-white">{item.storyNumber}</Text>
          </View>
        </View>
        <View className="p-4">
          <Text
            className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={{ textAlign: item.isRTL ? 'right' : 'left' }}
            numberOfLines={1}>
            {item.title}
          </Text>

          {/* Source Reference */}
          {sourceReference && (
            <TouchableOpacity
              onLongPress={() => {
                Alert.alert('', sourceReference, [{ text: 'OK' }]);
              }}
              activeOpacity={0.7}>
              <Text
                className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}
                style={{ textAlign: item.isRTL ? 'right' : 'left' }}
                numberOfLines={1}>
                {sourceReference}
              </Text>
            </TouchableOpacity>
          )}

          <Text
            className={`${sourceReference ? 'mt-1' : 'mt-2'} text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            style={{ textAlign: item.isRTL ? 'right' : 'left' }}>
            {item.collectionDisplayName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const FavoriteFrameImage = ({
    storyNumber,
    frameNumber,
  }: {
    storyNumber: number;
    frameNumber: number;
  }) => {
    const frameImage = useObsImage({
      reference: {
        story: storyNumber,
        frame: frameNumber,
      },
    });

    return <Image source={frameImage} className="h-48 w-full" resizeMode="cover" />;
  };

  const renderFavoriteFrame = ({ item }: { item: FavoriteFrame }) => (
    <TouchableOpacity
      onPress={() => navigateToFrame(item)}
      className={`mx-4 mb-6 overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
      <View className="relative">
        <FavoriteFrameImage storyNumber={item.storyNumber} frameNumber={item.frameNumber} />
        {/* Frame badge with icon and reference */}
        <View
          className={`absolute top-3 ${item.isRTL ? 'left-3' : 'right-3'} flex-row items-center rounded-full px-3 py-2 ${isDark ? 'bg-red-600/90' : 'bg-red-500/90'}`}>
          <MaterialIcons name="photo" size={16} color="#FFFFFF" />
          <Text className="ml-1 text-sm font-bold text-white">
            {item.storyNumber}:{item.frameNumber}
          </Text>
        </View>
      </View>
      <View className="p-4">
        <Text
          className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
          style={{ textAlign: item.isRTL ? 'right' : 'left' }}
          numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <Text
          className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          style={{ textAlign: item.isRTL ? 'right' : 'left' }}>
          {item.collectionDisplayName}
        </Text>
        {item.text && (
          <Text
            className={`mt-3 text-sm leading-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            style={{ textAlign: item.isRTL ? 'right' : 'left' }}
            numberOfLines={2}>
            {item.text}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMarker = ({ item }: { item: FavoriteMarker }) => (
    <TouchableOpacity
      onPress={() => navigateToMarker(item)}
      className={`mx-4 mb-4 flex-row items-center rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
      {/* Colored marker indicator */}
      <View
        className="mr-4 h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: item.color || '#FFD700' }}>
        <MaterialIcons name="bookmark" size={20} color="#FFFFFF" />
      </View>

      {/* Content */}
      <View className="flex-1 justify-center">
        <Text
          className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
          style={{ textAlign: item.isRTL ? 'right' : 'left' }}
          numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <Text
          className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          style={{ textAlign: item.isRTL ? 'right' : 'left' }}
          numberOfLines={1}>
          {item.collectionDisplayName}
        </Text>
        {item.note && (
          <Text
            className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            style={{ textAlign: item.isRTL ? 'right' : 'left' }}
            numberOfLines={1}>
            {item.note}
          </Text>
        )}
      </View>

      {/* Frame reference */}
      <View className="mx-3 justify-center">
        <FrameBadge
          storyNumber={item.storyNumber}
          frameNumber={item.frameNumber}
          size="compact"
          showIcon={false}
        />
      </View>

      {/* Delete button */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          deleteMarker(item.id);
        }}
        className={`rounded-full p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <MaterialIcons name="delete" size={16} color={isDark ? '#EF4444' : '#DC2626'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderComment = ({ item }: { item: FavoriteComment }) => (
    <TouchableOpacity
      onPress={() => navigateToComment(item)}
      className={`mx-4 mb-4 flex-row items-center rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
      {/* Note icon indicator */}
      <View
        className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
        <MaterialIcons name="edit-note" size={20} color="#FFFFFF" />
      </View>

      {/* Content */}
      <View className="flex-1 justify-center">
        <Text
          className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
          style={{ textAlign: item.isRTL ? 'right' : 'left' }}
          numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <Text
          className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          style={{ textAlign: item.isRTL ? 'right' : 'left' }}
          numberOfLines={1}>
          {item.collectionDisplayName}
        </Text>
        <Text
          className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          style={{ textAlign: item.isRTL ? 'right' : 'left' }}
          numberOfLines={1}>
          {item.comment}
        </Text>
        <Text
          className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
          style={{ textAlign: item.isRTL ? 'right' : 'left' }}>
          {item.createdAt.toLocaleDateString()}
          {item.updatedAt.getTime() !== item.createdAt.getTime() && ' • edited'}
        </Text>
      </View>

      {/* Frame reference */}
      <View className="mx-3 justify-center">
        <FrameBadge
          storyNumber={item.storyNumber}
          frameNumber={item.frameNumber}
          size="compact"
          showIcon={false}
        />
      </View>

      {/* Delete button */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          deleteComment(item.id);
        }}
        className={`rounded-full p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <MaterialIcons name="delete" size={16} color={isDark ? '#EF4444' : '#DC2626'} />
      </TouchableOpacity>
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
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header with icon tabs */}
      <View className={`px-6 pb-4 pt-6 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <View className="flex-row justify-center">
          <TouchableOpacity
            onPress={() => setActiveTab('favorites')}
            className={`mx-2 items-center rounded-2xl px-6 py-3 ${
              activeTab === 'favorites'
                ? isDark
                  ? 'bg-blue-600'
                  : 'bg-blue-500'
                : isDark
                  ? 'bg-gray-800'
                  : 'bg-white'
            } shadow-sm`}>
            <MaterialIcons
              name="favorite"
              size={24}
              color={activeTab === 'favorites' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text
              className={`mt-1 text-xs font-medium ${
                activeTab === 'favorites'
                  ? 'text-white'
                  : isDark
                    ? 'text-gray-400'
                    : 'text-gray-600'
              }`}>
              {favoriteStories.length + favoriteFrames.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('markers')}
            className={`mx-2 items-center rounded-2xl px-6 py-3 ${
              activeTab === 'markers'
                ? isDark
                  ? 'bg-blue-600'
                  : 'bg-blue-500'
                : isDark
                  ? 'bg-gray-800'
                  : 'bg-white'
            } shadow-sm`}>
            <MaterialIcons
              name="bookmark"
              size={24}
              color={activeTab === 'markers' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text
              className={`mt-1 text-xs font-medium ${
                activeTab === 'markers' ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              {markers.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('comments')}
            className={`mx-2 items-center rounded-2xl px-6 py-3 ${
              activeTab === 'comments'
                ? isDark
                  ? 'bg-blue-600'
                  : 'bg-blue-500'
                : isDark
                  ? 'bg-gray-800'
                  : 'bg-white'
            } shadow-sm`}>
            <MaterialIcons
              name="edit-note"
              size={24}
              color={activeTab === 'comments' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text
              className={`mt-1 text-xs font-medium ${
                activeTab === 'comments' ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              {comments.length}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'favorites' ? (
        favoriteStories.length + favoriteFrames.length > 0 ? (
          <FlatList
            data={combinedFavorites}
            renderItem={({ item }) =>
              item.type === 'story' ? renderFavoriteStory({ item }) : renderFavoriteFrame({ item })
            }
            keyExtractor={(item) =>
              item.type === 'story'
                ? `story-${item.collectionId}-${item.storyNumber}`
                : `frame-${item.collectionId}-${item.storyNumber}-${item.frameNumber}`
            }
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons name="favorite" size={64} color={isDark ? '#374151' : '#D1D5DB'} />
          </View>
        )
      ) : activeTab === 'markers' ? (
        markers.length > 0 ? (
          <FlatList
            data={markers}
            renderItem={renderMarker}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons name="bookmark" size={64} color={isDark ? '#374151' : '#D1D5DB'} />
          </View>
        )
      ) : comments.length > 0 ? (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <MaterialIcons name="edit-note" size={64} color={isDark ? '#374151' : '#D1D5DB'} />
        </View>
      )}
    </SafeAreaView>
  );
}
