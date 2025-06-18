import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';

import { StoryManager } from '@/core/storyManager';
import { useStoryNavigation } from '@/hooks/useStoryNavigation';

export default function StoryRedirect() {
  const { storyNumber, frameNumber } = useLocalSearchParams<{
    storyNumber: string;
    frameNumber: string;
  }>();
  const router = useRouter();
  const { navigateToStory } = useStoryNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Get the most recent reading progress using StoryManager
        const storyManager = StoryManager.getInstance();
        await storyManager.initialize();

        const allProgress = await storyManager.getAllReadingProgress();

        if (allProgress.length === 0) {
          // If no reading progress, redirect to the main read screen
          console.warn('No reading progress found, redirecting to read screen');
          router.replace('/(tabs)/(read)');
          return;
        }

        // Get the most recent collection ID
        const mostRecent = allProgress.sort((a, b) => b.timestamp - a.timestamp)[0];
        const lastCollectionId = mostRecent.collectionId;

        if (!storyNumber || !frameNumber) {
          console.error('Missing storyNumber or frameNumber parameters');
          router.replace('/(tabs)/(read)');
          return;
        }

        // Convert string params to numbers
        const storyNum = parseInt(storyNumber, 10);
        const frameNum = parseInt(frameNumber, 10);

        if (isNaN(storyNum) || isNaN(frameNum)) {
          console.error('Invalid storyNumber or frameNumber parameters');
          router.replace('/(tabs)/(read)');
          return;
        }

        // Use the story navigation hook to navigate with user preferences
        await navigateToStory(lastCollectionId, storyNum, frameNum);
      } catch (error) {
        console.error('Error handling story redirect:', error);
        // Fallback to main read screen
        router.replace('/(tabs)/(read)');
      }
    };

    handleRedirect();
  }, [storyNumber, frameNumber, router, navigateToStory]);

  // Show loading indicator while redirecting
  return (
    <View
      className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
    </View>
  );
}
