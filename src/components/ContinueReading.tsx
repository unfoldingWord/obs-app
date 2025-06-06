import { useObsImage } from 'hooks/useObsImage';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

import { FrameBadge } from './FrameBadge';
import { CollectionsManager, Story, Collection } from '../core/CollectionsManager';
import { UnifiedLanguagesManager } from '../core/UnifiedLanguagesManager';
import { UserProgress } from '../core/storyManager';

interface ContinueReadingProps {
  lastReadProgress: UserProgress;
  onPress: () => void;
  isDark: boolean;
}

export function ContinueReading({ lastReadProgress, onPress, isDark }: ContinueReadingProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isRTL, setIsRTL] = useState(false);

  // Generate image URL based on the current story/frame
  const image = useObsImage({
    reference: { story: lastReadProgress.storyNumber, frame: lastReadProgress.frameNumber },
  });

  useEffect(() => {
    const loadStoryData = async () => {
      try {
        const collectionsManager = CollectionsManager.getInstance();
        const languagesManager = UnifiedLanguagesManager.getInstance();
        await collectionsManager.initialize();
        await languagesManager.initialize();

        // Fetch story details
        const storyData = await collectionsManager.getStory(
          lastReadProgress.collectionId,
          lastReadProgress.storyNumber
        );
        setStory(storyData);

        // Fetch collection details
        const collectionData = await collectionsManager.getCollection(
          lastReadProgress.collectionId
        );
        setCollection(collectionData);

        // Get language direction
        if (collectionData) {
          const languageData = await languagesManager.getLanguage(collectionData.language);
          setIsRTL(languageData?.ld === 'rtl');
        }
      } catch (error) {
        console.error('Error loading story data for continue reading:', error);
      }
    };

    loadStoryData();
  }, [lastReadProgress.collectionId, lastReadProgress.storyNumber]);

  return (
    <View className="mb-4">
      <TouchableOpacity
        onPress={onPress}
        className={`overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <Image source={image} style={{ width: '100%', height: 120 }} resizeMode="cover" />
        <View className="p-4">
          <View
            className="mb-3 flex-row items-start justify-between"
            style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <View
              className="flex-1"
              style={{ paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text
                className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {story?.title || `Story ${lastReadProgress.storyNumber}`}
              </Text>
              <Text
                className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {collection?.displayName || lastReadProgress.collectionId}
              </Text>
            </View>
            <View style={{ alignSelf: 'flex-start' }}>
              <FrameBadge
                storyNumber={lastReadProgress.storyNumber}
                frameNumber={lastReadProgress.frameNumber}
                size="compact"
                isRTL={isRTL}
              />
            </View>
          </View>

          {/* Progress bar */}
          <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <View
              className={`h-full rounded-full ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
              style={{
                width: `${(lastReadProgress.frameNumber / lastReadProgress.totalFrames) * 100}%`,
                alignSelf: isRTL ? 'flex-end' : 'flex-start',
              }}
            />
          </View>
          <Text
            className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
            style={{ textAlign: isRTL ? 'left' : 'right' }}>
            {Math.round((lastReadProgress.frameNumber / lastReadProgress.totalFrames) * 100)}%
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
