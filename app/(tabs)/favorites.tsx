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
import { CommentsManager, FrameComment } from '../../src/core/CommentsManager';
import { StoryManager, UserMarker } from '../../src/core/storyManager';
import { FrameBadge } from '../../src/components/FrameBadge';

interface FavoriteStory extends Story {
  collectionDisplayName?: string;
  thumbnailUrl?: string;
}

interface FavoriteFrame extends Frame {
  storyTitle?: string;
  collectionDisplayName?: string;
}

interface FavoriteMarker extends UserMarker {
  storyTitle?: string;
  collectionDisplayName?: string;
}

interface FavoriteComment extends FrameComment {
  storyTitle?: string;
  collectionDisplayName?: string;
}

export default function FavoritesScreen() {
  const [activeTab, setActiveTab] = useState<'favorites' | 'markers' | 'comments'>(
    'favorites'
  );
  const [loading, setLoading] = useState(true);
  const [favoriteStories, setFavoriteStories] = useState<FavoriteStory[]>([]);
  const [favoriteFrames, setFavoriteFrames] = useState<FavoriteFrame[]>([]);
  const [markers, setMarkers] = useState<FavoriteMarker[]>([]);
  const [comments, setComments] = useState<FavoriteComment[]>([]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Combine and sort favorites by timestamp (most recent first)
  const combinedFavorites = [...favoriteStories.map(story => ({ ...story, type: 'story' as const })), ...favoriteFrames.map(frame => ({ ...frame, type: 'frame' as const }))].sort((a, b) => {
    // Sort by most recently added (you might need to add timestamps to your data)
    return 0; // For now, keep original order
  });

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
          const collection = await collectionsManager.getCollection(story.collectionId);
          return {
            ...story,
            collectionDisplayName: collection?.displayName || story.collectionId,
            thumbnailUrl: `https://cdn.door43.org/obs/jpg/360px/obs-en-${story.storyNumber.toString().padStart(2, '0')}-01.jpg`,
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
          return {
            ...frame,
            storyTitle: story?.title || `Story ${frame.storyNumber}`,
            collectionDisplayName: collection?.displayName || frame.collectionId,
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
          return {
            ...marker,
            storyTitle: story?.title || `Story ${marker.storyNumber}`,
            collectionDisplayName: collection?.displayName || marker.collectionId,
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
          return {
            ...comment,
            storyTitle: story?.title || `Story ${comment.storyNumber}`,
            collectionDisplayName: collection?.displayName || comment.collectionId,
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

      await collectionsManager.initialize();
      await storyManager.initialize();

      // Load favorite stories
      const favStories = await collectionsManager.getFavoriteStories();
      const storiesWithThumbnails = await Promise.all(
        favStories.map(async (story) => {
          const collection = await collectionsManager.getCollection(story.collectionId);
          return {
            ...story,
            collectionDisplayName: collection?.displayName || story.collectionId,
            thumbnailUrl: `https://cdn.door43.org/obs/jpg/360px/obs-en-${story.storyNumber.toString().padStart(2, '0')}-01.jpg`,
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
          return {
            ...frame,
            storyTitle: story?.title || `Story ${frame.storyNumber}`,
            collectionDisplayName: collection?.displayName || frame.collectionId,
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
          return {
            ...marker,
            storyTitle: story?.title || `Story ${marker.storyNumber}`,
            collectionDisplayName: collection?.displayName || marker.collectionId,
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
          return {
            ...comment,
            storyTitle: story?.title || `Story ${comment.storyNumber}`,
            collectionDisplayName: collection?.displayName || comment.collectionId,
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

  const navigateToStory = (story: FavoriteStory) => {
    router.push(`/story/${encodeURIComponent(story.collectionId)}/${story.storyNumber}/1`);
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

  const navigateToComment = (comment: FavoriteComment) => {
    router.push(
      `/story/${encodeURIComponent(comment.collectionId)}/${comment.storyNumber}/${comment.frameNumber}`
    );
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

  const renderFavoriteStory = ({ item }: { item: FavoriteStory }) => (
    <TouchableOpacity
      onPress={() => navigateToStory(item)}
      className={`mx-4 mb-6 overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
      <View className="relative">
        <Image source={{ uri: item.thumbnailUrl }} className="h-48 w-full" resizeMode="cover" />
        {/* Story badge with icon and number */}
        <View className={`absolute top-3 right-3 flex-row items-center rounded-full px-3 py-2 ${isDark ? 'bg-blue-600/90' : 'bg-blue-500/90'}`}>
          <MaterialIcons name="menu-book" size={16} color="#FFFFFF" />
          <Text className="ml-1 text-sm font-bold text-white">
            {item.storyNumber}
          </Text>
        </View>
      </View>
      <View className="p-4">
        <Text
          className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
          numberOfLines={1}>
          {item.title}
        </Text>
        <Text className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {item.collectionDisplayName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFavoriteFrame = ({ item }: { item: FavoriteFrame }) => (
    <TouchableOpacity
      onPress={() => navigateToFrame(item)}
      className={`mx-4 mb-6 overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
      <View className="relative">
        <Image source={{ uri: item.imageUrl }} className="h-48 w-full" resizeMode="cover" />
        {/* Frame badge with icon and reference */}
        <View className={`absolute top-3 right-3 flex-row items-center rounded-full px-3 py-2 ${isDark ? 'bg-red-600/90' : 'bg-red-500/90'}`}>
          <MaterialIcons name="photo" size={16} color="#FFFFFF" />
          <Text className="ml-1 text-sm font-bold text-white">
            {item.storyNumber}:{item.frameNumber}
          </Text>
        </View>
      </View>
      <View className="p-4">
        <Text
          className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
          numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {item.collectionDisplayName}
        </Text>
        {item.text && (
          <Text
            className={`mt-3 text-sm leading-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
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
          numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <Text
          className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          numberOfLines={1}>
          {item.collectionDisplayName}
        </Text>
        {item.note && (
          <Text
            className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
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
      <View className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
        <MaterialIcons name="edit-note" size={20} color="#FFFFFF" />
      </View>

      {/* Content */}
      <View className="flex-1 justify-center">
        <Text
          className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
          numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <Text
          className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          numberOfLines={1}>
          {item.collectionDisplayName}
        </Text>
        <Text
          className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          numberOfLines={1}>
          {item.comment}
        </Text>
        <Text className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
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
      <View className={`px-6 pt-6 pb-4 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
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
            <Text className={`mt-1 text-xs font-medium ${
              activeTab === 'favorites' ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
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
            <Text className={`mt-1 text-xs font-medium ${
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
            <Text className={`mt-1 text-xs font-medium ${
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
            <MaterialIcons
              name="favorite"
              size={64}
              color={isDark ? '#374151' : '#D1D5DB'}
            />
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
            <MaterialIcons
              name="bookmark"
              size={64}
              color={isDark ? '#374151' : '#D1D5DB'}
            />
          </View>
        )
      ) : (
        comments.length > 0 ? (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons
              name="edit-note"
              size={64}
              color={isDark ? '#374151' : '#D1D5DB'}
            />
          </View>
        )
      )}
    </SafeAreaView>
  );
}
