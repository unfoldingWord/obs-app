import AsyncStorage from '@react-native-async-storage/async-storage';

import { warn } from './utils';

export interface ReadingProgress {
  storyId: string;
  title: string;
  frameIndex: number;
  language: string;
  owner: string;
  repositoryId: string;
  timestamp: number;
}

export class UserProgressManager {
  private static instance: UserProgressManager;
  private static LAST_READ_KEY = '@obs_reader_last_read';
  private static READING_HISTORY_KEY = '@obs_reader_history';
  private static CURRENT_REPOSITORY_KEY = '@obs_current_repository';

  private constructor() {}

  static getInstance(): UserProgressManager {
    if (!UserProgressManager.instance) {
      UserProgressManager.instance = new UserProgressManager();
    }
    return UserProgressManager.instance;
  }

  /**
   * Save the current reading progress
   */
  async saveReadingProgress(progress: ReadingProgress): Promise<void> {
    try {
      // Save as the last read item
      await AsyncStorage.setItem(UserProgressManager.LAST_READ_KEY, JSON.stringify(progress));

      // Also add to reading history
      const history = await this.getReadingHistory();

      // Update existing entry or add new one
      const existingIndex = history.findIndex(
        (item) => item.storyId === progress.storyId && item.repositoryId === progress.repositoryId
      );

      if (existingIndex !== -1) {
        history[existingIndex] = progress;
      } else {
        // Add at the beginning (most recent first)
        history.unshift(progress);

        // Keep only the most recent 20 items
        if (history.length > 20) {
          history.pop();
        }
      }

      // Save updated history
      await AsyncStorage.setItem(UserProgressManager.READING_HISTORY_KEY, JSON.stringify(history));

      console.log('Saved reading progress:', progress);
    } catch (error) {
      warn(
        `Error saving reading progress: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the last read item
   */
  async getLastRead(): Promise<ReadingProgress | null> {
    try {
      const lastReadJson = await AsyncStorage.getItem(UserProgressManager.LAST_READ_KEY);
      if (lastReadJson) {
        return JSON.parse(lastReadJson) as ReadingProgress;
      }
      return null;
    } catch (error) {
      warn(
        `Error getting last read item: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  /**
   * Get reading history (most recent first)
   */
  async getReadingHistory(): Promise<ReadingProgress[]> {
    try {
      const historyJson = await AsyncStorage.getItem(UserProgressManager.READING_HISTORY_KEY);
      if (historyJson) {
        return JSON.parse(historyJson) as ReadingProgress[];
      }
      return [];
    } catch (error) {
      warn(
        `Error getting reading history: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  /**
   * Clear all reading history
   */
  async clearReadingHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(UserProgressManager.READING_HISTORY_KEY);
      await AsyncStorage.removeItem(UserProgressManager.LAST_READ_KEY);
    } catch (error) {
      warn(
        `Error clearing reading history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Save the current repository ID
   */
  async saveCurrentRepository(repositoryId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(UserProgressManager.CURRENT_REPOSITORY_KEY, repositoryId);
      console.log('Saved current repository:', repositoryId);
    } catch (error) {
      warn(
        `Error saving current repository: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the current repository ID
   */
  async getCurrentRepository(): Promise<string | null> {
    try {
      const repositoryId = await AsyncStorage.getItem(UserProgressManager.CURRENT_REPOSITORY_KEY);
      return repositoryId;
    } catch (error) {
      warn(
        `Error getting current repository: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }
}
