import { useState, useEffect } from 'react';

import { UserProgressManager, ReadingProgress } from '../core/userProgressManager';

export function useReadingProgress() {
  const [lastReadStory, setLastReadStory] = useState<ReadingProgress | null>(null);

  useEffect(() => {
    loadLastRead();
  }, []);

  const loadLastRead = async () => {
    try {
      const progressManager = UserProgressManager.getInstance();
      const lastRead = await progressManager.getLastRead();
      if (lastRead) {
        setLastReadStory(lastRead);
        console.log('Loaded last read story:', lastRead);
      }
    } catch (err) {
      console.error('Error loading last read:', err);
    }
  };

  const saveReadingProgress = async (progress: ReadingProgress) => {
    try {
      const progressManager = UserProgressManager.getInstance();
      await progressManager.saveReadingProgress(progress);
      setLastReadStory(progress);
    } catch (err) {
      console.error('Error saving reading progress:', err);
    }
  };

  return {
    lastReadStory,
    saveReadingProgress,
    refreshLastRead: loadLastRead,
  };
}
