import * as FileSystem from 'expo-file-system';
import { ImageSet } from '../types';
import { StoriesData, StoryFrame } from '../types/index';
import { warn } from './utils';

const IMAGE_CACHE_DIR = 'image-cache';
const BUNDLED_IMAGES_DIR = 'bundled-images';

export interface ImagePack {
  id: string;
  version: string;
  name: string;
  description: string;
  frameCount: number;
  images: {
    id: string;
    path: string;
    size: number;
    dimensions: {
      width: number;
      height: number;
    };
  }[];
}

export class ImageManager {
  private static instance: ImageManager;
  private cacheDir: string;
  private bundledDir: string;
  private imagePacks: Map<string, ImagePack> = new Map();
  private defaultImagePack: ImagePack | null = null;

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

      // Load default image pack
      this.defaultImagePack = await this.loadDefaultImagePack();
      if (this.defaultImagePack) {
        this.imagePacks.set(this.defaultImagePack.id, this.defaultImagePack);
      }
    } catch (error) {
      warn(`Error initializing image directories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadDefaultImagePack(): Promise<ImagePack | null> {
    try {
      // In a real app, this would load from bundled assets
      // For now, return mock data
      return {
        id: 'default-image-pack',
        version: '1.0.0',
        name: 'Default Image Pack',
        description: 'Default image pack for Open Bible Stories',
        frameCount: 50,
        images: Array.from({ length: 50 }, (_, i) => ({
          id: `frame${i + 1}`,
          path: `images/frame${i + 1}.png`,
          size: 102400,
          dimensions: {
            width: 800,
            height: 600,
          },
        })),
      };
    } catch (error) {
      warn(`Error loading default image pack: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async getImagePack(id: string): Promise<ImagePack | null> {
    // Check if pack is already loaded
    if (this.imagePacks.has(id)) {
      return this.imagePacks.get(id) || null;
    }

    try {
      // Download image pack
      const response = await fetch(`https://git.door43.org/api/v1/image-packs/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to download image pack: ${response.status}`);
      }

      const imagePack = await response.json();
      this.imagePacks.set(id, imagePack);
      return imagePack;
    } catch (error) {
      warn(`Error getting image pack: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async getImageUrl(storiesData: StoriesData, frameId: string): Promise<string> {
    try {
      // Get image pack
      const imagePackId = storiesData.imagePack?.id || 'default-image-pack';
      const imagePack = await this.getImagePack(imagePackId);
      if (!imagePack) {
        throw new Error('Image pack not found');
      }

      // Find image in pack
      const image = imagePack.images.find(img => img.id === frameId);
      if (!image) {
        throw new Error('Image not found in pack');
      }

      // In a real app, this would return the actual image URL
      // For now, return a mock URL
      return `https://example.com/images/${image.path}`;
    } catch (error) {
      warn(`Error getting image URL: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }

  async getImageResolutions(storiesData: StoriesData, frameId: string): Promise<{
    low: string;
    medium: string;
    high: string;
  }> {
    const baseUrl = await this.getImageUrl(storiesData, frameId);
    return {
      low: `${baseUrl}?size=360`,
      medium: `${baseUrl}?size=720`,
      high: `${baseUrl}?size=1080`,
    };
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
