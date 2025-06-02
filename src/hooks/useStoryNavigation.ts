import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

type ReadingMode = 'horizontal' | 'vertical';

export const useStoryNavigation = () => {
  const router = useRouter();

  const navigateToStory = useCallback(
    async (collectionId: string, storyNumber: number, frameNumber: number = 1) => {
      try {
        // Get the stored reading mode preference
        const savedMode = await AsyncStorage.getItem('readingModePreference');
        const readingMode: ReadingMode = savedMode === 'vertical' ? 'vertical' : 'horizontal';

        // Navigate based on the preference
        if (readingMode === 'vertical') {
          router.push(
            `/story/${encodeURIComponent(collectionId)}/${storyNumber}/vertical?frame=${frameNumber}`
          );
        } else {
          router.push(`/story/${encodeURIComponent(collectionId)}/${storyNumber}/${frameNumber}`);
        }
      } catch (error) {
        console.error('Error getting reading mode preference:', error);
        // Fallback to horizontal mode
        router.push(`/story/${encodeURIComponent(collectionId)}/${storyNumber}/${frameNumber}`);
      }
    },
    [router]
  );

  const navigateToStoryStart = useCallback(
    async (collectionId: string, storyNumber: number) => {
      await navigateToStory(collectionId, storyNumber, 1);
    },
    [navigateToStory]
  );

  return {
    navigateToStory,
    navigateToStoryStart,
  };
};
