import { StoryFrame } from '../types';
import { warn } from './utils';
import { ImageSourcePropType } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Define bundled images as a type rather than actual imports
// These should be used in a component's source prop directly
export type BundledImageKey = string;

/**
 * BundledImage structure
 */
export interface BundledImage {
  key: BundledImageKey;
  localPath?: string;
  remoteUrl: string;
  language: string;
  storyId: string;
  frameId: string;
}

/**
 * Base URL for remote OBS images
 */
const OBS_BASE_URL = 'https://cdn.door43.org/obs/jpg';

/**
 * Quality options for images
 */
export type ImageQuality = 'low' | 'medium' | 'high';

/**
 * Resolution map for different quality levels
 */
const QUALITY_RESOLUTION_MAP: Record<ImageQuality, string> = {
  low: '360px',
  medium: '720px',
  high: '1080px',
};

/**
 * Local storage directory for downloaded images
 */
const IMAGE_DIRECTORY = `${FileSystem.documentDirectory}stories/`;

/**
 * Check if the local storage directory exists, create it if it doesn't
 */
export async function ensureImageDirectoryExists(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_DIRECTORY, { intermediates: true });
    }
  } catch (error) {
    console.error('Error ensuring image directory exists:', error);
  }
}

/**
 * Parse an image key into its components
 *
 * @param key The image key to parse (e.g., "obs-en-01-01")
 * @returns Object containing parsed components
 */
export function parseImageKey(key: BundledImageKey): { language: string; storyId: string; frameId: string } {
  const parts = key.split('-');

  if (parts.length !== 4 || parts[0] !== 'obs') {
    throw new Error(`Invalid image key format: ${key}`);
  }

  return {
    language: parts[1],
    storyId: parts[2],
    frameId: parts[3],
  };
}

/**
 * Get the remote URL for an image
 *
 * @param key The image key
 * @param quality The desired image quality
 * @returns The remote URL
 */
export function getRemoteImageUrl(key: BundledImageKey, quality: ImageQuality = 'medium'): string {
  const resolution = QUALITY_RESOLUTION_MAP[quality];
  return `${OBS_BASE_URL}/${resolution}/${key}.jpg`;
}

/**
 * Get the local path for an image
 *
 * @param key The image key
 * @returns The local file path
 */
export function getLocalImagePath(key: BundledImageKey): string {
  return `${IMAGE_DIRECTORY}${key}.jpg`;
}

/**
 * Check if an image exists locally
 *
 * @param key The image key
 * @returns Promise that resolves to a boolean indicating if the image exists locally
 */
export async function imageExistsLocally(key: BundledImageKey): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(getLocalImagePath(key));
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking if image exists locally:', error);
    return false;
  }
}

/**
 * Download an image to local storage
 *
 * @param key The image key
 * @param quality The desired image quality
 * @returns Promise that resolves when the download is complete
 */
export async function downloadImage(key: BundledImageKey, quality: ImageQuality = 'medium'): Promise<void> {
  await ensureImageDirectoryExists();

  const remoteUrl = getRemoteImageUrl(key, quality);
  const localPath = getLocalImagePath(key);

  try {
    await FileSystem.downloadAsync(remoteUrl, localPath);
  } catch (error) {
    console.error(`Error downloading image ${key}:`, error);
    throw error;
  }
}

/**
 * Get image information including local path and remote URL
 *
 * @param key The image key
 * @param quality The desired image quality
 * @returns Promise that resolves to an object with image information
 */
export async function getImageInfo(key: BundledImageKey, quality: ImageQuality = 'medium'): Promise<BundledImage> {
  const { language, storyId, frameId } = parseImageKey(key);
  const remoteUrl = getRemoteImageUrl(key, quality);

  const exists = await imageExistsLocally(key);
  const localPath = exists ? getLocalImagePath(key) : undefined;

  return {
    key,
    localPath,
    remoteUrl,
    language,
    storyId,
    frameId,
  };
}

/**
 * Manages access to bundled images in the app
 */
export class BundledImageManager {
  private static instance: BundledImageManager;

  private constructor() {}

  static getInstance(): BundledImageManager {
    if (!BundledImageManager.instance) {
      BundledImageManager.instance = new BundledImageManager();
    }
    return BundledImageManager.instance;
  }

  /**
   * Get a bundled image name for a story frame
   * @param frame The story frame
   * @returns The image name for the story frame or null if not supported
   */
  getImageName(frame: StoryFrame): BundledImageKey | null {
    try {
      const storyNumber = frame.id.substring(0, 2);
      const frameNumber = frame.id.substring(2);

      // Create a name in the format obs-en-01-01
      const imageName = `obs-en-${storyNumber}-${frameNumber}` as BundledImageKey;

      // Check if this is a supported bundled image
      if (this.isValidBundledImage(imageName)) {
        return imageName;
      }

      return null;
    } catch (error) {
      warn(`Error getting bundled image name: ${error}`);
      return null;
    }
  }

  /**
   * Check if an image name is a valid bundled image
   */
  private isValidBundledImage(name: string): name is BundledImageKey {
    const validKeys: BundledImageKey[] = [
      'obs-en-01-01',
      'obs-en-01-02',
      'obs-en-01-03',
      'obs-en-01-04',
      'obs-en-01-05'
    ];

    return validKeys.includes(name as BundledImageKey);
  }

  /**
   * Check if a bundled image exists for the given frame
   * @param frame The story frame
   * @returns True if a bundled image exists
   */
  hasBundledImage(frame: StoryFrame): boolean {
    return !!this.getImageName(frame);
  }
}
