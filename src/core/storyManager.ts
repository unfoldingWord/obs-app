import AsyncStorage from '@react-native-async-storage/async-storage';

import { CollectionsManager, Story, Frame } from './CollectionsManager';
import { warn } from './utils';

export interface UserProgress {
  collectionId: string;
  storyNumber: number;
  frameNumber: number;
  timestamp: number;
  totalFrames: number;
}

export interface UserMarker {
  id: string;
  collectionId: string;
  storyNumber: number;
  frameNumber: number;
  note?: string;
  timestamp: number;
  color?: string; // For different marker colors
}

export interface RecentlyViewed {
  collectionId: string;
  storyNumber: number;
  title: string;
  timestamp: number;
}

export class StoryManager {
  private static instance: StoryManager;
  private collectionsManager: CollectionsManager;

  private constructor() {
    this.collectionsManager = CollectionsManager.getInstance();
  }

  static getInstance(): StoryManager {
    if (!StoryManager.instance) {
      StoryManager.instance = new StoryManager();
    }
    return StoryManager.instance;
  }

  /**
   * Initialize the manager
   */
  async initialize(): Promise<void> {
    await this.collectionsManager.initialize();
  }

  /**
   * Get stories for a collection
   */
  async getStoriesForCollection(collectionId: string): Promise<Story[]> {
    return this.collectionsManager.getCollectionStories(collectionId);
  }

  /**
   * Get a specific story
   */
  async getStory(collectionId: string, storyNumber: number): Promise<Story | null> {
    return this.collectionsManager.getStory(collectionId, storyNumber);
  }

  /**
   * Get frames for a story
   */
  async getStoryFrames(collectionId: string, storyNumber: number): Promise<Frame[]> {
    return this.collectionsManager.getStoryFrames(collectionId, storyNumber);
  }

  /**
   * Get a specific frame
   */
  async getFrame(collectionId: string, storyNumber: number, frameNumber: number): Promise<Frame | null> {
    return this.collectionsManager.getFrame(collectionId, storyNumber, frameNumber);
  }

  // ===== USER PROGRESS TRACKING =====

  /**
   * Save reading progress for a story
   */
  async saveReadingProgress(
    collectionId: string,
    storyNumber: number,
    frameNumber: number,
    totalFrames: number
  ): Promise<void> {
    try {
      const key = `@reading_progress:${collectionId}:${storyNumber}`;
      const progress: UserProgress = {
        collectionId,
        storyNumber,
        frameNumber,
        timestamp: Date.now(),
        totalFrames,
      };
      await AsyncStorage.setItem(key, JSON.stringify(progress));

      // Also update recently viewed
      await this.addToRecentlyViewed(collectionId, storyNumber);
    } catch (error) {
      warn(`Error saving reading progress: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get reading progress for a story
   */
  async getReadingProgress(collectionId: string, storyNumber: number): Promise<UserProgress | null> {
    try {
      const key = `@reading_progress:${collectionId}:${storyNumber}`;
      const progress = await AsyncStorage.getItem(key);
      return progress ? JSON.parse(progress) : null;
    } catch (error) {
      warn(`Error getting reading progress: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Get all reading progress
   */
  async getAllReadingProgress(): Promise<UserProgress[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key => key.startsWith('@reading_progress:'));
      const progressEntries = await AsyncStorage.multiGet(progressKeys);

      return progressEntries
        .map(([key, value]) => value ? JSON.parse(value) : null)
        .filter(Boolean);
    } catch (error) {
      warn(`Error getting all reading progress: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // ===== USER MARKERS =====

  /**
   * Add a marker to a frame
   */
  async addMarker(
    collectionId: string,
    storyNumber: number,
    frameNumber: number,
    note?: string,
    color?: string
  ): Promise<string> {
    try {
      const markerId = `${collectionId}_${storyNumber}_${frameNumber}_${Date.now()}`;
      const marker: UserMarker = {
        id: markerId,
        collectionId,
        storyNumber,
        frameNumber,
        note,
        color: color || '#FFD700', // Default to gold
        timestamp: Date.now(),
      };

      const key = `@marker:${markerId}`;
      await AsyncStorage.setItem(key, JSON.stringify(marker));
      return markerId;
    } catch (error) {
      warn(`Error adding marker: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get markers for a specific frame
   */
  async getMarkersForFrame(collectionId: string, storyNumber: number, frameNumber: number): Promise<UserMarker[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const markerKeys = keys.filter(key => key.startsWith('@marker:'));
      const markerEntries = await AsyncStorage.multiGet(markerKeys);

      const markers = markerEntries
        .map(([key, value]) => value ? JSON.parse(value) : null)
        .filter(Boolean)
        .filter((marker: UserMarker) =>
          marker.collectionId === collectionId &&
          marker.storyNumber === storyNumber &&
          marker.frameNumber === frameNumber
        );

      return markers.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      warn(`Error getting markers for frame: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Get all markers for a story
   */
  async getMarkersForStory(collectionId: string, storyNumber: number): Promise<UserMarker[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const markerKeys = keys.filter(key => key.startsWith('@marker:'));
      const markerEntries = await AsyncStorage.multiGet(markerKeys);

      const markers = markerEntries
        .map(([key, value]) => value ? JSON.parse(value) : null)
        .filter(Boolean)
        .filter((marker: UserMarker) =>
          marker.collectionId === collectionId &&
          marker.storyNumber === storyNumber
        );

      return markers.sort((a, b) => a.frameNumber - b.frameNumber);
    } catch (error) {
      warn(`Error getting markers for story: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Get all markers across all stories and collections
   */
  async getAllMarkers(): Promise<UserMarker[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const markerKeys = keys.filter(key => key.startsWith('@marker:'));
      const markerEntries = await AsyncStorage.multiGet(markerKeys);

      const markers = markerEntries
        .map(([key, value]) => value ? JSON.parse(value) : null)
        .filter(Boolean);

      return markers.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      warn(`Error getting all markers: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Delete a marker
   */
  async deleteMarker(markerId: string): Promise<void> {
    try {
      const key = `@marker:${markerId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      warn(`Error deleting marker: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ===== RECENTLY VIEWED =====

  /**
   * Add to recently viewed stories
   */
  async addToRecentlyViewed(collectionId: string, storyNumber: number): Promise<void> {
    try {
      const story = await this.getStory(collectionId, storyNumber);
      if (!story) return;

      const recentItem: RecentlyViewed = {
        collectionId,
        storyNumber,
        title: story.title,
        timestamp: Date.now(),
      };

      // Get existing recent items
      const existing = await this.getRecentlyViewed();

      // Remove existing entry if present
      const filtered = existing.filter(
        item => !(item.collectionId === collectionId && item.storyNumber === storyNumber)
      );

      // Add new item at the beginning
      const updated = [recentItem, ...filtered].slice(0, 10); // Keep only 10 most recent

      await AsyncStorage.setItem('@recently_viewed', JSON.stringify(updated));
    } catch (error) {
      warn(`Error adding to recently viewed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get recently viewed stories
   */
  async getRecentlyViewed(): Promise<RecentlyViewed[]> {
    try {
      const recent = await AsyncStorage.getItem('@recently_viewed');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      warn(`Error getting recently viewed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // ===== FAVORITES (delegate to CollectionsManager) =====

  /**
   * Toggle story favorite
   */
  async toggleStoryFavorite(collectionId: string, storyNumber: number): Promise<void> {
    await this.collectionsManager.toggleStoryFavorite(collectionId, storyNumber);
  }

  /**
   * Toggle frame favorite
   */
  async toggleFrameFavorite(collectionId: string, storyNumber: number, frameNumber: number): Promise<void> {
    await this.collectionsManager.toggleFrameFavorite(collectionId, storyNumber, frameNumber);
  }

  /**
   * Get favorite stories
   */
  async getFavoriteStories(): Promise<Story[]> {
    return this.collectionsManager.getFavoriteStories();
  }

  /**
   * Get favorite frames
   */
  async getFavoriteFrames(): Promise<Frame[]> {
    return this.collectionsManager.getFavoriteFrames();
  }
}
