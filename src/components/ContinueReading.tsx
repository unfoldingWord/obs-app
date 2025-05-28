import { useObsImage } from 'hooks/useObsImage';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

import { UserProgress } from '../core/storyManager';
import { CollectionsManager, Story, Collection } from '../core/CollectionsManager';

interface ContinueReadingProps {
  lastReadProgress: UserProgress;
  onPress: () => void;
  isDark: boolean;
}

export function ContinueReading({ lastReadProgress, onPress, isDark }: ContinueReadingProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);

  // Generate image URL based on the current story/frame
  const image = useObsImage({
    reference: { story: lastReadProgress.storyNumber, frame: lastReadProgress.frameNumber },
  });

  useEffect(() => {
    const loadStoryData = async () => {
      try {
        const collectionsManager = CollectionsManager.getInstance();
        await collectionsManager.initialize();

        // Fetch story details
        const storyData = await collectionsManager.getStory(
          lastReadProgress.collectionId,
          lastReadProgress.storyNumber
        );
        setStory(storyData);

        // Fetch collection details
        const collectionData = await collectionsManager.getCollectionById(lastReadProgress.collectionId);
        setCollection(collectionData);
      } catch (error) {
        console.error('Error loading story data for continue reading:', error);
      }
    };

    loadStoryData();
  }, [lastReadProgress.collectionId, lastReadProgress.storyNumber]);

  return (
    <View className="mb-4">
      <Text className={`mb-3 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Continue Reading
      </Text>
      <TouchableOpacity
        onPress={onPress}
        className={`overflow-hidden rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <Image source={image} style={{ width: '100%', height: 120 }} resizeMode="cover" />
        <View className="p-4">
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {story?.title || `Story ${lastReadProgress.storyNumber}`}
          </Text>
          <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Frame {lastReadProgress.frameNumber} of {lastReadProgress.totalFrames}
          </Text>
          <Text className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {collection?.displayName || lastReadProgress.collectionId}
          </Text>

          {/* Progress bar */}
          <View className={`mt-3 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <View
              className={`h-full rounded-full ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
              style={{
                width: `${(lastReadProgress.frameNumber / lastReadProgress.totalFrames) * 100}%`,
              }}
            />
          </View>
          <Text className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {Math.round((lastReadProgress.frameNumber / lastReadProgress.totalFrames) * 100)}%
            complete
          </Text>
        </View>
      </TouchableOpacity>

      <Text className={`mb-0 mt-6 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Downloaded Collections
      </Text>
    </View>
  );
}
