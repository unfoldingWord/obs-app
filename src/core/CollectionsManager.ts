import JSZip from 'jszip';
import { DatabaseManager } from './DatabaseManager';
import { ImageManager } from './imageManager';
import { LanguagesManager } from './LanguagesManager';
import { warn } from './utils';

export interface Collection {
  id: string; // Format: "owner/repository-name"
  owner: string; // Repository owner
  language: string; // Language code
  displayName: string; // Human-readable name
  version: string; // Collection version
  imageSetId: string; // Associated image set (Consider if still needed with per-frame images)
  lastUpdated: Date; // Last update timestamp
  isDownloaded: boolean; // Download status
  metadata?: {
    description?: string;
    targetAudience?: string;
    thumbnail?: string;
  };
}

// V2 Story Interface
export interface Story {
  collectionId: string;
  storyNumber: number; // e.g., 1, 2, 3 derived from filename like "01.md"
  title: string;
  isFavorite: boolean;
  metadata?: Record<string, any>;
}

// V2 Frame Interface
export interface Frame {
  collectionId: string;
  storyNumber: number; // Links to Story
  frameNumber: number; // Sequential number within the story, e.g., 1, 2, 3
  imageUrl: string;
  text: string; // Text content for this specific frame
  isFavorite: boolean;
  metadata?: Record<string, any>;
}

interface RemoteCollection {
  name: string;
  owner: string;
  language: string;
  title: string;
  description?: string;
  release?: {
    tag_name: string;
    published_at: string;
  };
  repo?: {
    description: string;
    avatar_url: string;
  };
}

export interface SearchResult {
  id: string;
  collectionId: string;
  collectionName: string;
  storyNumber: number;
  storyTitle: string;
  frameNumber: number;
  text: string;
  highlightedText: string;
}

export class CollectionsManager {
  private static instance: CollectionsManager;
  private databaseManager: DatabaseManager;
  private imagesManager: ImageManager;
  private initialized: boolean = false;

  private constructor() {
    this.databaseManager = DatabaseManager.getInstance();
    this.imagesManager = ImageManager.getInstance();
  }

  static getInstance(): CollectionsManager {
    if (!CollectionsManager.instance) {
      CollectionsManager.instance = new CollectionsManager();
    }
    return CollectionsManager.instance;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.databaseManager.initialize();
      this.initialized = true;
    }
  }

  // Conversion helpers
  private convertDbToCollection(dbCollection: any): Collection {
    return {
      id: dbCollection.id,
      owner: dbCollection.owner,
      language: dbCollection.language,
      displayName: dbCollection.displayName,
      version: dbCollection.version,
      imageSetId: dbCollection.imageSetId,
      lastUpdated: new Date(dbCollection.lastUpdated),
      isDownloaded: dbCollection.isDownloaded,
      metadata: dbCollection.metadata
    };
  }

  private convertCollectionToDb(collection: Collection) {
    return {
      id: collection.id,
      owner: collection.owner,
      language: collection.language,
      displayName: collection.displayName,
      version: collection.version,
      imageSetId: collection.imageSetId,
      lastUpdated: collection.lastUpdated.toISOString(),
      isDownloaded: collection.isDownloaded,
      metadata: collection.metadata
    };
  }

  private convertDbToStory(dbStory: any): Story {
    return {
      collectionId: dbStory.collection_id,
      storyNumber: dbStory.story_number,
      title: dbStory.title,
      isFavorite: dbStory.is_favorite,
      metadata: dbStory.metadata
    };
  }

  private convertStoryToDb(story: Story) {
    return {
      collection_id: story.collectionId,
      story_number: story.storyNumber,
      title: story.title,
      is_favorite: story.isFavorite,
      metadata: story.metadata
    };
  }

  private convertDbToFrame(dbFrame: any): Frame {
    return {
      collectionId: dbFrame.collection_id,
      storyNumber: dbFrame.story_number,
      frameNumber: dbFrame.frame_number,
      imageUrl: dbFrame.image_url,
      text: dbFrame.text,
      isFavorite: dbFrame.is_favorite,
      metadata: dbFrame.metadata
    };
  }

  private convertFrameToDb(frame: Frame) {
    return {
      collection_id: frame.collectionId,
      story_number: frame.storyNumber,
      frame_number: frame.frameNumber,
      image_url: frame.imageUrl,
      text: frame.text,
      is_favorite: frame.isFavorite,
      metadata: frame.metadata
    };
  }

  // Remote Operations (keeping existing implementation)
  async getRemoteLanguages(): Promise<any[]> {
    try {
      const response = await fetch(
        'https://git.door43.org/api/v1/catalog/list/languages?subject=Open Bible Stories&stage=prod'
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.status}`);
      }

      const { data } = await response.json();
      const languages = new Set<any>(data);

      return Array.from(languages).sort();
    } catch (error) {
      warn(
        `Error fetching available languages: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  async getRemoteCollectionsByLanguage(language: string): Promise<Collection[]> {
    try {
      const params = new URLSearchParams({
        subject: 'Open Bible Stories',
        stage: 'prod',
        lang: language,
      });

      const response = await fetch(`https://git.door43.org/api/v1/catalog/search?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to search collections: ${response.status}`);
      }

      const { data } = await response.json();
      return (data || []).map((item: RemoteCollection) => this.convertRemoteToCollection(item));
    } catch (error) {
      warn(
        `Error searching collections: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  // Local Collection Operations using DatabaseManager
  async getLocalCollections(): Promise<Collection[]> {
    if (!this.initialized) await this.initialize();
    const dbCollections = await this.databaseManager.getAllCollections();
    return dbCollections.map(col => this.convertDbToCollection(col));
  }

  async getLocalCollectionsByLanguage(language: string): Promise<Collection[]> {
    if (!this.initialized) await this.initialize();
    const dbCollections = await this.databaseManager.getCollectionsByLanguage(language);
    return dbCollections.map(col => this.convertDbToCollection(col));
  }

  async getLocalLanguages(): Promise<string[]> {
    if (!this.initialized) await this.initialize();
    const collections = await this.databaseManager.getAllCollections();
    const languages = new Set(collections.map(c => c.language));
    return Array.from(languages).sort();
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    if (!this.initialized) await this.initialize();
    const dbCollection = await this.databaseManager.getCollection(id);
    return dbCollection ? this.convertDbToCollection(dbCollection) : null;
  }

  // Story Operations
  async getCollectionStories(collectionId: string): Promise<Story[]> {
    if (!this.initialized) await this.initialize();
    const dbStories = await this.databaseManager.getStoriesByCollection(collectionId);
    return dbStories.map(story => this.convertDbToStory(story));
  }

  async getStory(collectionId: string, storyNumber: number): Promise<Story | null> {
    if (!this.initialized) await this.initialize();
    const dbStory = await this.databaseManager.getStory(collectionId, storyNumber);
    return dbStory ? this.convertDbToStory(dbStory) : null;
  }

  // Frame Operations
  async getStoryFrames(collectionId: string, storyNumber: number): Promise<Frame[]> {
    if (!this.initialized) await this.initialize();
    const dbFrames = await this.databaseManager.getFramesByStory(collectionId, storyNumber);
    return dbFrames.map(frame => this.convertDbToFrame(frame));
  }

  async getFrame(collectionId: string, storyNumber: number, frameNumber: number): Promise<Frame | null> {
    if (!this.initialized) await this.initialize();
    const dbFrame = await this.databaseManager.getFrame(collectionId, storyNumber, frameNumber);
    return dbFrame ? this.convertDbToFrame(dbFrame) : null;
  }

  // Favorite Operations
  async toggleStoryFavorite(collectionId: string, storyNumber: number): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.databaseManager.toggleStoryFavorite(collectionId, storyNumber);
  }

  async toggleFrameFavorite(collectionId: string, storyNumber: number, frameNumber: number): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.databaseManager.toggleFrameFavorite(collectionId, storyNumber, frameNumber);
  }

  async getFavoriteStories(): Promise<Story[]> {
    if (!this.initialized) await this.initialize();
    const dbStories = await this.databaseManager.getFavoriteStories();
    return dbStories.map(story => this.convertDbToStory(story));
  }

  async getFavoriteFrames(): Promise<Frame[]> {
    if (!this.initialized) await this.initialize();
    const dbFrames = await this.databaseManager.getFavoriteFrames();
    return dbFrames.map(frame => this.convertDbToFrame(frame));
  }

  // Search Operations
  async searchContent(query: string, collectionId?: string): Promise<SearchResult[]> {
    if (!this.initialized) await this.initialize();

    const dbFrames = await this.databaseManager.searchFrameText(query, collectionId);
    const results: SearchResult[] = [];

    for (const dbFrame of dbFrames) {
      const frame = this.convertDbToFrame(dbFrame);
      const story = await this.getStory(frame.collectionId, frame.storyNumber);
      const collection = await this.getCollectionById(frame.collectionId);

      if (story && collection) {
        results.push({
          id: `${frame.collectionId}_${frame.storyNumber}_${frame.frameNumber}`,
          collectionId: frame.collectionId,
          collectionName: collection.displayName,
          storyNumber: frame.storyNumber,
          storyTitle: story.title,
          frameNumber: frame.frameNumber,
          text: frame.text,
          highlightedText: this.highlightSearchTerm(frame.text, query)
        });
      }
    }

    return results;
  }

  private highlightSearchTerm(text: string, term: string): string {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Delete Operations
  async deleteCollection(id: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      // Clean up user data first
      await this.cleanupUserDataForCollection(id);

      // Delete from unified database
      await this.databaseManager.deleteCollection(id);

      // Clean up thumbnails
      await this.deleteCollectionThumbnail(id);

      warn(`✅ Collection ${id} and all associated data deleted successfully`);
    } catch (error) {
      warn(`❌ Error deleting collection ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Keep existing methods for compatibility but delegate to DatabaseManager
  async markAsDownloaded(id: string, downloaded: boolean): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.databaseManager.markCollectionAsDownloaded(id, downloaded);
  }

  // Thumbnail Management Methods
  async getCollectionThumbnail(id: string): Promise<string | null> {
    if (!this.initialized) await this.initialize();
    return this.imagesManager.getCollectionThumbnail(id);
  }

  async saveCollectionThumbnail(id: string, imageData: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.imagesManager.saveCollectionThumbnail(id, imageData);
  }

  private async deleteCollectionThumbnail(id: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.imagesManager.deleteCollectionThumbnail(id);
  }

  // Keep remaining methods that don't directly interact with database...

  private async cleanupUserDataForCollection(collectionId: string): Promise<void> {
    try {
      // Import managers dynamically to avoid circular dependencies
      const { StoryManager } = await import('./storyManager');
      const { CommentsManager } = await import('./CommentsManager');

      // Clean up reading progress from AsyncStorage
      await this.cleanupReadingProgress(collectionId);

      // Clean up user markers from AsyncStorage
      await this.cleanupUserMarkers(collectionId);

      // Clean up recently viewed from AsyncStorage
      await this.cleanupRecentlyViewed(collectionId);

      // Clean up comments from SQLite database
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.initialize();
      await this.cleanupComments(commentsManager, collectionId);

      warn(`Cleaned up all user data for collection ${collectionId}`);
    } catch (error) {
      warn(
        `Error cleaning up user data for collection ${collectionId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async cleanupReadingProgress(collectionId: string): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key =>
        key.startsWith('@reading_progress:') && key.includes(collectionId)
      );

      if (progressKeys.length > 0) {
        await AsyncStorage.multiRemove(progressKeys);
        warn(`Removed ${progressKeys.length} reading progress entries for collection ${collectionId}`);
      }
    } catch (error) {
      warn(`Error cleaning up reading progress: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async cleanupUserMarkers(collectionId: string): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const keys = await AsyncStorage.getAllKeys();
      const markerKeys = keys.filter(key => key.startsWith('@marker:'));

      if (markerKeys.length > 0) {
        const markerEntries = await AsyncStorage.multiGet(markerKeys);
        const keysToRemove: string[] = [];

        for (const [key, value] of markerEntries) {
          if (value) {
            try {
              const marker = JSON.parse(value);
              if (marker.collectionId === collectionId) {
                keysToRemove.push(key);
              }
            } catch (parseError) {
              // If we can't parse the marker, skip it
              warn(`Error parsing marker ${key}: ${parseError}`);
            }
          }
        }

        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
          warn(`Removed ${keysToRemove.length} user markers for collection ${collectionId}`);
        }
      }
    } catch (error) {
      warn(`Error cleaning up user markers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async cleanupRecentlyViewed(collectionId: string): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const keys = await AsyncStorage.getAllKeys();
      const recentlyViewedKeys = keys.filter(key => key.startsWith('@recently_viewed:'));

      if (recentlyViewedKeys.length > 0) {
        const recentlyViewedEntries = await AsyncStorage.multiGet(recentlyViewedKeys);
        const keysToRemove: string[] = [];

        for (const [key, value] of recentlyViewedEntries) {
          if (value) {
            try {
              const items = JSON.parse(value);
              if (Array.isArray(items)) {
                const filteredItems = items.filter(item => item.collectionId !== collectionId);
                if (filteredItems.length !== items.length) {
                  if (filteredItems.length > 0) {
                    // Update the list without the deleted collection's items
                    await AsyncStorage.setItem(key, JSON.stringify(filteredItems));
                  } else {
                    // Remove the entire key if no items remain
                    keysToRemove.push(key);
                  }
                }
              }
            } catch (parseError) {
              warn(`Error parsing recently viewed ${key}: ${parseError}`);
            }
          }
        }

        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }
        warn(`Cleaned up recently viewed entries for collection ${collectionId}`);
      }
    } catch (error) {
      warn(`Error cleaning up recently viewed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async cleanupComments(commentsManager: any, collectionId: string): Promise<void> {
    try {
      // Use the CommentsManager's efficient bulk delete method
      await commentsManager.initialize();
      const deletedCount = await commentsManager.deleteCommentsForCollection(collectionId);
      warn(`Removed ${deletedCount} comments for collection ${collectionId}`);
    } catch (error) {
      warn(`Error cleaning up comments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private convertRemoteToCollection(remote: RemoteCollection): Collection {
    const collectionId = `${remote.owner}/${remote.name}`;
    return {
      id: collectionId,
      owner: remote.owner,
      language: remote.language,
      displayName: remote.title || remote.name,
      version: remote.release?.tag_name || '1.0.0',
      imageSetId: 'default-image-pack', // This might need to be dynamic or from manifest
      lastUpdated: new Date(remote.release?.published_at || Date.now()),
      isDownloaded: false, // Default for remote collections
      metadata: {
        description: remote.description || remote.repo?.description,
        thumbnail: remote.repo?.avatar_url,
      },
    };
  }

  // ZIP Processing and Storage
  private async processAndStoreZip(collection: Collection, zipData: ArrayBuffer): Promise<void> {
    try {
      // Save the collection record first
      const dbCollectionData = this.convertCollectionToDb(collection);
      await this.databaseManager.saveCollection(dbCollectionData);

      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(zipData);
      const filesToProcess = Object.entries(loadedZip.files);

      const storyFileRegex = /(?:^|\/)(?:content\/)?(\d+)\.md$/i;
      const frameParseRegex =
        /!\[[^\]]*?\]\(([^)]+?)\)\s*([\s\S]*?)(?=(?:!\[[^\]]*?\]\([^)]+?\))|$)/g;

      for (const [fullPath, zipEntry] of filesToProcess) {
        if (zipEntry.dir) continue;

        const content = await zipEntry.async('string');
        const storyMatch = fullPath.match(storyFileRegex);

        if (storyMatch) {
          const storyNumber = parseInt(storyMatch[1], 10);
          if (isNaN(storyNumber)) {
            warn(`Skipping file with invalid story number: ${fullPath}`);
            continue;
          }

          let titleFromContent = '';
          const contentLines = content.split('\n');
          if (contentLines.length > 0) {
            const firstLine = contentLines[0].trim();
            if (firstLine.startsWith('# ')) {
              titleFromContent = firstLine.substring(2).trim();
            }
          }

          const title = titleFromContent || storyMatch[1] || `Story ${storyNumber}`;

          const storyData = this.convertStoryToDb({
            collectionId: collection.id,
            storyNumber,
            title,
            isFavorite: false,
          });
          await this.databaseManager.saveStory(storyData);

          let frameNumber = 0;
          let match;
          frameParseRegex.lastIndex = 0;
          while ((match = frameParseRegex.exec(content)) !== null) {
            frameNumber++;
            const imageUrl = match[1].trim();
            const frameText = match[2].trim();
            if (!imageUrl || !frameText) {
              warn(
                `Skipping empty frame ${frameNumber} in story ${storyNumber} of ${collection.id}`
              );
              continue;
            }

            const frameData = this.convertFrameToDb({
              collectionId: collection.id,
              storyNumber,
              frameNumber,
              imageUrl,
              text: frameText,
              isFavorite: false,
            });
            await this.databaseManager.saveFrame(frameData);
          }
        }
      }

      warn(`Processed and stored files from zip for collection ${collection.id}`);
    } catch (error) {
      warn(
        `Error processing ZIP for collection ${collection.id}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  private async downloadThumbnail(collection: Collection): Promise<void> {
    try {
      if (!collection.metadata?.thumbnail) return;

      const response = await fetch(collection.metadata.thumbnail);
      if (!response.ok) {
        warn(`Failed to download thumbnail for ${collection.id}: ${response.status}`);
        return;
      }
      const blob = await response.blob();
      const reader = new FileReader();

      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64 = base64data.split(',')[1];
          if (base64) {
            resolve(base64);
          } else {
            reject(new Error('Failed to convert thumbnail to base64'));
          }
        };
        reader.onerror = (error) => reject(error);
      });

      reader.readAsDataURL(blob);
      const base64 = await base64Promise;

      await this.saveCollectionThumbnail(collection.id, base64);
    } catch (error) {
      warn(
        `Error downloading thumbnail for ${collection.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async saveLanguageData(languageCode: string, languageData?: any): Promise<void> {
    try {
      const languagesManager = LanguagesManager.getInstance();
      await languagesManager.initialize();

      // If we have language data from the remote source, save it
      if (languageData) {
        await languagesManager.updateLanguageFromRemote(languageData);
      } else {
        // If no language data provided, create a minimal entry with just the language code
        await languagesManager.saveLanguage({
          lc: languageCode,
          ln: languageCode, // Use language code as fallback for native name
          ang: languageCode, // Use language code as fallback for English name
        });
      }

      // Note: We no longer need to mark language as having collections
      // since this is determined by querying the collections table
    } catch (error) {
      warn(
        `Error saving language data for ${languageCode}: ${error instanceof Error ? error.message : String(error)}`
      );
      // Don't throw error here as language data saving is not critical for collection download
    }
  }

  // Download Operations
  async downloadRemoteCollection(collection: Collection, languageData?: any): Promise<void> {
    if (!this.initialized) await this.initialize();
    try {
      // Save language data FIRST to satisfy foreign key constraints
      await this.saveLanguageData(collection.language, languageData);

      const [owner, repoName] = collection.id.split('/');
      const zipballUrl = `https://git.door43.org/${owner}/${repoName}/archive/${collection.version}.zip`;
      const response = await fetch(zipballUrl);

      if (!response.ok) {
        throw new Error(`Failed to download collection ${collection.id}: ${response.status}`);
      }

      const zipData = await response.arrayBuffer();

      await this.processAndStoreZip(collection, zipData);

      if (collection.metadata?.thumbnail) {
        await this.downloadThumbnail(collection);
      }

      await this.markAsDownloaded(collection.id, true);
    } catch (error) {
      warn(
        `Error downloading collection ${collection.id}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}

