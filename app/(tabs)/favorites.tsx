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
  const [activeTab, setActiveTab] = useState<'stories' | 'frames' | 'markers' | 'comments'>(
    'stories'
  );
  const [loading, setLoading] = useState(true);
  const [favoriteStories, setFavoriteStories] = useState<FavoriteStory[]>([]);
  const [favoriteFrames, setFavoriteFrames] = useState<FavoriteFrame[]>([]);
  const [markers, setMarkers] = useState<FavoriteMarker[]>([]);
  const [comments, setComments] = useState<FavoriteComment[]>([]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      className={`m-2 overflow-hidden rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Image source={{ uri: item.thumbnailUrl }} className="h-32 w-full" />
      <View className="p-4">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.title}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {item.collectionDisplayName}
        </Text>
        <Text className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Story {item.storyNumber}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFavoriteFrame = ({ item }: { item: FavoriteFrame }) => (
    <TouchableOpacity
      onPress={() => navigateToFrame(item)}
      className={`m-2 overflow-hidden rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Image source={{ uri: item.imageUrl }} className="h-32 w-full" />
      <View className="p-4">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.storyTitle}, Frame {item.frameNumber}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {item.collectionDisplayName}
        </Text>
        <Text
          className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          numberOfLines={2}>
          {item.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMarker = ({ item }: { item: FavoriteMarker }) => (
    <TouchableOpacity
      onPress={() => navigateToMarker(item)}
      className={`m-2 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.storyTitle}, Frame {item.frameNumber}
        </Text>
        <TouchableOpacity onPress={() => deleteMarker(item.id)} className="p-1">
          <MaterialIcons name="delete" size={20} color={isDark ? '#EF4444' : '#DC2626'} />
        </TouchableOpacity>
      </View>
      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {item.collectionDisplayName}
      </Text>
      {item.note && (
        <Text className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.note}</Text>
      )}
      <View className="mt-2 flex-row items-center">
        <View
          className="mr-2 h-3 w-3 rounded-full"
          style={{ backgroundColor: item.color || '#FFD700' }}
        />
        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderComment = ({ item }: { item: FavoriteComment }) => (
    <TouchableOpacity
      onPress={() => navigateToComment(item)}
      className={`m-2 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.storyTitle}, Frame {item.frameNumber}
        </Text>
        <TouchableOpacity onPress={() => deleteComment(item.id)} className="p-1">
          <MaterialIcons name="delete" size={20} color={isDark ? '#EF4444' : '#DC2626'} />
        </TouchableOpacity>
      </View>
      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {item.collectionDisplayName}
      </Text>
      <Text className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.comment}</Text>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {item.createdAt.toLocaleDateString()}
        </Text>
        {item.updatedAt.getTime() !== item.createdAt.getTime() && (
          <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>edited</Text>
        )}
      </View>
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
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View
        className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Favorites
        </Text>
        <View className="mt-4 flex-row">
          <TouchableOpacity
            onPress={() => setActiveTab('stories')}
            className={`flex-1 rounded-l-lg py-2 ${
              activeTab === 'stories'
                ? isDark
                  ? 'bg-blue-600'
                  : 'bg-blue-500'
                : isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
            }`}>
            <Text
              className={`text-center text-xs ${
                activeTab === 'stories' ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Stories ({favoriteStories.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('frames')}
            className={`flex-1 py-2 ${
              activeTab === 'frames'
                ? isDark
                  ? 'bg-blue-600'
                  : 'bg-blue-500'
                : isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
            }`}>
            <Text
              className={`text-center text-xs ${
                activeTab === 'frames' ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Frames ({favoriteFrames.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('markers')}
            className={`flex-1 py-2 ${
              activeTab === 'markers'
                ? isDark
                  ? 'bg-blue-600'
                  : 'bg-blue-500'
                : isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
            }`}>
            <Text
              className={`text-center text-xs ${
                activeTab === 'markers' ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Bookmarks ({markers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('comments')}
            className={`flex-1 rounded-r-lg py-2 ${
              activeTab === 'comments'
                ? isDark
                  ? 'bg-blue-600'
                  : 'bg-blue-500'
                : isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
            }`}>
            <Text
              className={`text-center text-xs ${
                activeTab === 'comments' ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Notes ({comments.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'stories' ? (
        favoriteStories.length > 0 ? (
          <FlatList
            data={favoriteStories}
            renderItem={renderFavoriteStory}
            keyExtractor={(item) => `${item.collectionId}-${item.storyNumber}`}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <MaterialIcons
              name="favorite-border"
              size={48}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text
              className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No favorite stories yet
            </Text>
            <Text
              className={`mt-2 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Tap the heart icon while reading to add stories to your favorites
            </Text>
          </View>
        )
      ) : activeTab === 'frames' ? (
        favoriteFrames.length > 0 ? (
          <FlatList
            data={favoriteFrames}
            renderItem={renderFavoriteFrame}
            keyExtractor={(item) => `${item.collectionId}-${item.storyNumber}-${item.frameNumber}`}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <MaterialIcons
              name="favorite-border"
              size={48}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text
              className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No favorite frames yet
            </Text>
            <Text
              className={`mt-2 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Tap the heart icon on frames while reading to add them to your favorites
            </Text>
          </View>
        )
      ) : activeTab === 'markers' ? (
        markers.length > 0 ? (
          <FlatList
            data={markers}
            renderItem={renderMarker}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <MaterialIcons
              name="bookmark-border"
              size={48}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text
              className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No bookmarks yet
            </Text>
            <Text
              className={`mt-2 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Tap the bookmark icon while reading to add markers to your collection
            </Text>
          </View>
        )
      ) : comments.length > 0 ? (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center p-4">
          <MaterialIcons name="comment" size={48} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text
            className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No notes yet
          </Text>
          <Text
            className={`mt-2 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Add notes while reading to see them here
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
