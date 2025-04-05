import * as FileSystem from 'expo-file-system';
import { ImageSet, StoryFrame } from '../types';
import { warn } from './utils';

const IMAGE_CACHE_DIR = 'image-cache';
const BUNDLED_IMAGES_DIR = 'bundled-images';

export class ImageManager {
  private static instance: ImageManager;
  private cacheDir: string;
  private bundledDir: string;

  private constructor() {
    this.cacheDir = `${FileSystem.cacheDirectory}${IMAGE_CACHE_DIR}`;
    this.bundledDir = `${FileSystem.documentDirectory}${BUNDLED_IMAGES_DIR}`;
  }

  static getInstance(): ImageManager {
    if (!ImageManager.instance) {
      ImageManager.instance = new ImageManager();
    }
    return ImageManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize cache directory
      const cacheDirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!cacheDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      // Initialize bundled images directory
      const bundledDirInfo = await FileSystem.getInfoAsync(this.bundledDir);
      if (!bundledDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.bundledDir, { intermediates: true });
      }
    } catch (error) {
      warn(`Error initializing image directories: ${error}`);
    }
  }

  async getImageUrl(frame: StoryFrame, resolution: 'low' | 'medium' | 'high'): Promise<string> {
    const frameRef = this.getFrameReference(frame);
    const bundledPath = `${this.bundledDir}/${frameRef}.jpg`;
    const cachedPath = `${this.cacheDir}/${frameRef}.jpg`;

    try {
      // Check bundled images first
      const bundledInfo = await FileSystem.getInfoAsync(bundledPath);
      if (bundledInfo.exists) {
        return bundledPath;
      }

      // Then check cache
      const cachedInfo = await FileSystem.getInfoAsync(cachedPath);
      if (cachedInfo.exists) {
        return cachedPath;
      }

      // If not found, download from CDN
      const url = frame.image.resolutions[resolution];
      await FileSystem.downloadAsync(url, cachedPath);
      return cachedPath;
    } catch (error) {
      warn(`Error getting image: ${error}`);
      return frame.image.resolutions[resolution]; // Fallback to remote URL
    }
  }

  private getFrameReference(frame: StoryFrame): string {
    // Extract story number from frame ID (first 2 digits)
    const storyNumber = frame.id.substring(0, 2);
    // Extract frame number from frame ID (last 2 digits)
    const frameNumber = frame.id.substring(2);
    return `${storyNumber}_${frameNumber}`;
  }

  private getFilenameFromUrl(url: string): string {
    return url.split('/').pop() || '';
  }

  async downloadImageSet(set: ImageSet): Promise<void> {
    try {
      // Create a directory for this image set
      const setDir = `${this.cacheDir}/${set.id}`;
      await FileSystem.makeDirectoryAsync(setDir, { intermediates: true });

      // Download all images in the set
      for (const resolution of ['low', 'medium', 'high'] as const) {
        const url = set.resolutions[resolution];
        const filename = this.getFilenameFromUrl(url);
        await FileSystem.downloadAsync(url, `${setDir}/${filename}`);
      }
    } catch (error) {
      warn(`Error downloading image set: ${error}`);
    }
  }

  async setActiveImageSet(setId: string): Promise<void> {
    try {
      const setDir = `${this.cacheDir}/${setId}`;
      const setInfo = await FileSystem.getInfoAsync(setDir);

      if (!setInfo.exists) {
        throw new Error('Image set not found');
      }

      // Move images from set directory to cache directory
      const files = await FileSystem.readDirectoryAsync(setDir);
      for (const file of files) {
        const source = `${setDir}/${file}`;
        const dest = `${this.cacheDir}/${file}`;
        await FileSystem.moveAsync({ from: source, to: dest });
      }

      // Clean up set directory
      await FileSystem.deleteAsync(setDir, { idempotent: true });
    } catch (error) {
      warn(`Error setting active image set: ${error}`);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      await this.initialize();
    } catch (error) {
      warn(`Error clearing image cache: ${error}`);
    }
  }
}
