import { compareVersions } from 'compare-versions';
import * as FileSystem from 'expo-file-system';

import { fetchStories, getLatestRelease, getLatestVersion } from './fetchStories';
import { warn } from './utils';
import { StoriesData } from '../types';

// Constants for file paths and directories
const APP_DIRECTORY = 'obs-app';

/**
 * Gets stories from local storage or downloads them if they don't exist or are outdated
 * @param owner Repository owner
 * @param languageCode Language code
 * @returns Promise with the stories data
 */
export async function getStories(owner: string, languageCode: string): Promise<StoriesData> {
  // Case 1: No filesystem available (web platform) - fetch directly
  if (!FileSystem.documentDirectory) {
    warn('No Filesystem detected, fetching stories directly');
    return await fetchStories(owner, languageCode);
  }

  try {
    // Step 1: Try to get stories from local storage
    const localStories = await getLocalStories(owner, languageCode);

    // Case 2: No local stories exist - download them
    if (!isValidStoriesData(localStories)) {
      warn('Local stories not available or invalid, downloading to filesystem');
      return await storeStories(owner, languageCode);
    }

    // Step 2: Check for updates if online
    return await checkForUpdates(owner, languageCode, localStories);
  } catch (error) {
    // Case 3: Error in the process - fallback to fetching directly
    warn(`Error in getStories: ${formatError(error)}`);
    return await fetchStories(owner, languageCode);
  }
}

/**
 * Checks if StoriesData is valid
 */
function isValidStoriesData(data: StoriesData | undefined): data is StoriesData {
  return !!data && !!data.stories;
}

/**
 * Format error message
 */
function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Checks for updated stories and returns either updated or local stories
 */
async function checkForUpdates(
  owner: string,
  languageCode: string,
  localStories: StoriesData
): Promise<StoriesData> {
  try {
    // Step 1: Get latest release info
    const latestRelease = await getLatestRelease(owner, languageCode);

    // Case 1: No internet connection - use local stories
    if (!latestRelease) {
      warn('No internet connection, using local stories');
      return localStories;
    }

    // Step 2: Get latest version info
    const latestVersion = await getLatestVersion(owner, languageCode, latestRelease['tag_name']);

    // Step 3: Compare versions
    const currentVersion = localStories.version || '0.0.0';

    if (isNewerVersion(latestVersion, currentVersion)) {
      warn('Newer version available, downloading updated stories');
      return await storeStories(owner, languageCode);
    }

    // Case 3: Local version is up-to-date
    warn('Local stories are up-to-date, using from filesystem');
    return localStories;
  } catch (error) {
    // Case 4: Error checking for updates - fallback to local stories
    warn(`Error checking for updates: ${formatError(error)}`);
    return localStories;
  }
}

/**
 * Checks if the remote version is newer than the local version
 */
function isNewerVersion(remoteVersion: string, localVersion: string): boolean {
  return compareVersions(remoteVersion || '0.0.0', localVersion) === 1;
}

/**
 * Gets stories from local storage
 * @param owner Repository owner
 * @param languageCode Language code
 * @returns Promise with the stories data or undefined if not found
 */
async function getLocalStories(
  owner: string,
  languageCode: string
): Promise<StoriesData | undefined> {
  try {
    const { fileUri } = getStoragePaths(owner, languageCode);

    return await FileSystem.readAsStringAsync(fileUri)
      .then((content) => {
        return typeof content === 'string' ? JSON.parse(content) : undefined;
      })
      .catch(() => undefined);
  } catch (error) {
    warn(`Error getting local stories: ${formatError(error)}`);
    return undefined;
  }
}

/**
 * Generate storage paths for stories using the pattern:
 * {obs-app}/{language}/{owner}/{fileName}
 */
function getStoragePaths(owner: string, languageCode: string) {
  const filename = 'stories.json';

  // Create nested directory structure
  const baseDir = `${FileSystem.documentDirectory}${APP_DIRECTORY}`;
  const langDir = `${baseDir}/${languageCode}`;
  const ownerDir = `${langDir}/${owner}`;
  const fileUri = `${ownerDir}/${filename}`;

  return {
    baseDir,
    langDir,
    ownerDir,
    fileUri,
    filename,
  };
}

/**
 * Downloads and stores stories in local storage
 * @param owner Repository owner
 * @param languageCode Language code
 * @returns Promise with the stories data
 */
async function storeStories(owner: string, languageCode: string): Promise<StoriesData> {
  try {
    // Step 1: Fetch stories from the network
    const stories = await fetchStories(owner, languageCode);

    if (!isValidStoriesData(stories)) {
      throw new Error('Failed to fetch valid stories data');
    }

    // Step 2: Prepare the file path
    const { baseDir, langDir, ownerDir, fileUri } = getStoragePaths(owner, languageCode);

    // Step 3: Ensure directories exist (create the entire path)
    await ensureDirectoryExists(baseDir);
    await ensureDirectoryExists(langDir);
    await ensureDirectoryExists(ownerDir);

    // Step 4: Write stories to the file
    warn(`Storing stories in file system at ${fileUri}`);
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(stories)).catch((e) => {
      warn(`Error writing stories file: ${formatError(e)}`);
      throw e;
    });

    // Step 5: Verify the stored data
    const storedStory = await verifyStoredStories(fileUri);

    if (storedStory) {
      return storedStory;
    } else {
      warn('No stored story found after writing. Using fetched stories.');
      return stories;
    }
  } catch (error) {
    warn(`Error storing stories: ${formatError(error)}`);
    // Return the fetched stories as a fallback
    return await fetchStories(owner, languageCode);
  }
}

/**
 * Ensures a directory exists, creating it if necessary
 */
async function ensureDirectoryExists(dirUri: string): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(dirUri);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }
  } catch (error) {
    warn(`Error ensuring directory exists: ${formatError(error)}`);
    throw error;
  }
}

/**
 * Verifies that stories were properly stored
 */
async function verifyStoredStories(fileUri: string): Promise<StoriesData | null> {
  try {
    return await FileSystem.readAsStringAsync(fileUri)
      .then((content) => JSON.parse(content))
      .catch((e) => {
        warn(`Error reading back stored stories: ${formatError(e)}`);
        return null;
      });
  } catch (error) {
    warn(`Error verifying stored stories: ${formatError(error)}`);
    return null;
  }
}
