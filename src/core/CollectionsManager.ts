import JSZip from 'jszip';

import { DatabaseManager } from './DatabaseManager';
import { LanguagesManager } from './LanguagesManager';
import { ImageManager } from './imageManager';
import { warn } from './utils';

export interface Collection {
  id: string;
  owner: {
    username: string;
    fullName?: string;
    avatarUrl?: string;
    description?: string;
    website?: string;
    location?: string;
    type?: 'user' | 'organization';
    repositoryLanguages?: string[];
    repositorySubjects?: string[];
  };
  language: string;
  displayName: string;
  version: string;
  imageSetId: string;
  lastUpdated: Date;
  isDownloaded: boolean;
  metadata?: {
    description?: string;
    thumbnail?: string;
    [key: string]: any;
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
  contents_url: string;
  release?: {
    tag_name: string;
    published_at: string;
  };
  repo?: {
    description: string;
    avatar_url: string;
    owner?: {
      id: number;
      login: string;
      login_name: string;
      full_name: string;
      email: string;
      avatar_url: string;
      html_url: string;
      description: string;
      website: string;
      location: string;
      visibility: string;
      repo_languages: string[];
      repo_subjects: string[];
      username: string;
      followers_count: number;
      following_count: number;
      starred_repos_count: number;
      created: string;
    };
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

/**
 * CollectionsManager - Manages Bible story collections with offline-first approach
 *
 * All Collection objects include embedded owner data from the catalog response,
 * eliminating the need for additional API calls during downloads.
 *
 * Owner data management:
 * - Owner records are shared across collections and persist when collections are deleted
 * - Each download updates owner information with the latest data from the catalog
 * - This ensures owner data stays fresh and accurate over time
 *
 * Usage example:
 * ```typescript
 * const manager = CollectionsManager.getInstance();
 *
 * // Get collections (always include embedded owner data)
 * const collections = await manager.getRemoteCollectionsByLanguage('en');
 *
 * // Download using embedded owner data (updates owner info automatically)
 * for (const { collection } of collections) {
 *   await manager.downloadRemoteCollection(collection);
 * }
 *
 * // Display collections with owner names (fully offline)
 * const localCollections = await manager.getLocalCollections();
 * for (const collection of localCollections) {
 *   console.log(`${collection.displayName} by ${collection.owner.fullName || collection.owner.username}`);
 * }
 * ```
 */
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
  private convertCollectionToDb(collection: Collection) {
    return {
      id: collection.id,
      owner: collection.owner.username,
      language: collection.language,
      displayName: collection.displayName,
      version: collection.version,
      imageSetId: collection.imageSetId,
      lastUpdated: collection.lastUpdated.toISOString(),
      isDownloaded: collection.isDownloaded,
      metadata: collection.metadata,
    };
  }

  private convertDbToStory(dbStory: any): Story {
    return {
      collectionId: dbStory.collection_id,
      storyNumber: dbStory.story_number,
      title: dbStory.title,
      isFavorite: dbStory.is_favorite,
      metadata: dbStory.metadata,
    };
  }

  private convertStoryToDb(story: Story) {
    return {
      collection_id: story.collectionId,
      story_number: story.storyNumber,
      title: story.title,
      is_favorite: story.isFavorite,
      metadata: story.metadata,
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
      metadata: dbFrame.metadata,
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
      metadata: frame.metadata,
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

  async getRemoteCollectionsByLanguage(
    language: string
  ): Promise<{ collection: Collection; ownerData: any; isValid: boolean }[]> {
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
      
      // Process collections asynchronously, keeping both valid and invalid
      const collectionPromises = (data || []).map((item: RemoteCollection) => 
        this.convertRemoteToCollection(item)
      );
      
      const collectionResults = await Promise.all(collectionPromises);
      
      // All collections are returned now (both valid and invalid)
      const allCollections = collectionResults as {
        collection: Collection;
        ownerData: any;
        isValid: boolean;
      }[];
      
      const validCount = allCollections.filter(result => result.isValid).length;
      const invalidCount = allCollections.length - validCount;
      
      console.log(`✅ Found ${validCount} valid and ${invalidCount} invalid collections out of ${data?.length || 0} total for language: ${language}`);
      
      return allCollections;
    } catch (error) {
      warn(
        `Error searching collections: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  /**
   * Convenience method to get just the collections without owner data.
   * @param language - Language code to search for
   * @returns Array of Collection objects with validation status
   */
  async getRemoteCollectionsOnly(language: string): Promise<{ collection: Collection; isValid: boolean }[]> {
    const collectionsWithOwners = await this.getRemoteCollectionsByLanguage(language);
    return collectionsWithOwners.map(({ collection, isValid }) => ({ collection, isValid }));
  }

  // Local Collection Operations using DatabaseManager
  async getLocalCollections(): Promise<Collection[]> {
    if (!this.initialized) await this.initialize();

    try {
      const collections = await this.databaseManager.getAllCollections();
      const collectionsWithOwnerData: Collection[] = [];

      for (const collection of collections) {
        const owner = await this.databaseManager.getRepositoryOwner(collection.owner);

        collectionsWithOwnerData.push({
          id: collection.id,
          owner: {
            username: collection.owner,
            fullName: owner?.fullName || undefined,
            avatarUrl: owner?.avatarUrl || undefined,
            description: owner?.description || undefined,
            website: owner?.website || undefined,
            location: owner?.location || undefined,
            type: owner?.ownerType as 'user' | 'organization' | undefined,
            repositoryLanguages: owner?.repositoryLanguages || [],
            repositorySubjects: owner?.repositorySubjects || [],
          },
          language: collection.language,
          displayName: collection.displayName,
          version: collection.version,
          imageSetId: collection.imageSetId,
          lastUpdated: new Date(collection.lastUpdated),
          isDownloaded: collection.isDownloaded,
          metadata: collection.metadata || undefined,
        });
      }

      return collectionsWithOwnerData;
    } catch (error) {
      console.error('Error getting local collections:', error);
      return [];
    }
  }

  async getLocalCollectionsByLanguage(language: string): Promise<Collection[]> {
    if (!this.initialized) await this.initialize();

    try {
      const collections = await this.databaseManager.getCollectionsByLanguage(language);
      const collectionsWithOwnerData: Collection[] = [];

      for (const collection of collections) {
        const owner = await this.databaseManager.getRepositoryOwner(collection.owner);

        collectionsWithOwnerData.push({
          id: collection.id,
          owner: {
            username: collection.owner,
            fullName: owner?.fullName || undefined,
            avatarUrl: owner?.avatarUrl || undefined,
            description: owner?.description || undefined,
            website: owner?.website || undefined,
            location: owner?.location || undefined,
            type: owner?.ownerType as 'user' | 'organization' | undefined,
            repositoryLanguages: owner?.repositoryLanguages || [],
            repositorySubjects: owner?.repositorySubjects || [],
          },
          language: collection.language,
          displayName: collection.displayName,
          version: collection.version,
          imageSetId: collection.imageSetId,
          lastUpdated: new Date(collection.lastUpdated),
          isDownloaded: collection.isDownloaded,
          metadata: collection.metadata || undefined,
        });
      }

      return collectionsWithOwnerData;
    } catch (error) {
      console.error('Error getting local collections by language:', error);
      return [];
    }
  }

  async getLocalLanguages(): Promise<string[]> {
    if (!this.initialized) await this.initialize();
    const collections = await this.databaseManager.getAllCollections();
    const languages = new Set(collections.map((c) => c.language));
    return Array.from(languages).sort();
  }

  async getCollection(id: string): Promise<Collection | null> {
    if (!this.initialized) await this.initialize();

    try {
      const collection = await this.databaseManager.getCollection(id);
      if (!collection) return null;

      const owner = await this.databaseManager.getRepositoryOwner(collection.owner);

      return {
        id: collection.id,
        owner: {
          username: collection.owner,
          fullName: owner?.fullName || undefined,
          avatarUrl: owner?.avatarUrl || undefined,
          description: owner?.description || undefined,
          website: owner?.website || undefined,
          location: owner?.location || undefined,
          type: owner?.ownerType as 'user' | 'organization' | undefined,
          repositoryLanguages: owner?.repositoryLanguages || [],
          repositorySubjects: owner?.repositorySubjects || [],
        },
        language: collection.language,
        displayName: collection.displayName,
        version: collection.version,
        imageSetId: collection.imageSetId,
        lastUpdated: new Date(collection.lastUpdated),
        isDownloaded: collection.isDownloaded,
        metadata: collection.metadata || undefined,
      };
    } catch (error) {
      console.error('Error getting collection by id:', error);
      return null;
    }
  }

  // Story Operations
  async getCollectionStories(collectionId: string): Promise<Story[]> {
    if (!this.initialized) await this.initialize();
    const dbStories = await this.databaseManager.getStoriesByCollection(collectionId);
    return dbStories.map((story) => this.convertDbToStory(story));
  }

  async getStory(collectionId: string, storyNumber: number): Promise<Story | null> {
    if (!this.initialized) await this.initialize();
    const dbStory = await this.databaseManager.getStory(collectionId, storyNumber);
    return dbStory ? this.convertDbToStory(dbStory) : null;
  }

  // Get source reference for a specific story
  async getStorySourceReference(collectionId: string, storyNumber: number): Promise<string | null> {
    const story = await this.getStory(collectionId, storyNumber);
    return story?.metadata?.sourceReference || null;
  }

  // Frame Operations
  async getStoryFrames(collectionId: string, storyNumber: number): Promise<Frame[]> {
    if (!this.initialized) await this.initialize();
    const dbFrames = await this.databaseManager.getFramesByStory(collectionId, storyNumber);
    return dbFrames.map((frame) => this.convertDbToFrame(frame));
  }

  async getFrame(
    collectionId: string,
    storyNumber: number,
    frameNumber: number
  ): Promise<Frame | null> {
    if (!this.initialized) await this.initialize();
    const dbFrame = await this.databaseManager.getFrame(collectionId, storyNumber, frameNumber);
    return dbFrame ? this.convertDbToFrame(dbFrame) : null;
  }

  // Favorite Operations
  async toggleStoryFavorite(collectionId: string, storyNumber: number): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.databaseManager.toggleStoryFavorite(collectionId, storyNumber);
  }

  async toggleFrameFavorite(
    collectionId: string,
    storyNumber: number,
    frameNumber: number
  ): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.databaseManager.toggleFrameFavorite(collectionId, storyNumber, frameNumber);
  }

  async getFavoriteStories(): Promise<Story[]> {
    if (!this.initialized) await this.initialize();
    const dbStories = await this.databaseManager.getFavoriteStories();
    return dbStories.map((story) => this.convertDbToStory(story));
  }

  async getFavoriteFrames(): Promise<Frame[]> {
    if (!this.initialized) await this.initialize();
    const dbFrames = await this.databaseManager.getFavoriteFrames();
    return dbFrames.map((frame) => this.convertDbToFrame(frame));
  }

  // Search Operations
  async searchContent(query: string, collectionId?: string): Promise<SearchResult[]> {
    if (!this.initialized) await this.initialize();

    const dbFrames = await this.databaseManager.searchFrameText(query, collectionId);
    const results: SearchResult[] = [];

    for (const dbFrame of dbFrames) {
      const frame = this.convertDbToFrame(dbFrame);
      const story = await this.getStory(frame.collectionId, frame.storyNumber);
      const collection = await this.getCollection(frame.collectionId);

      if (story && collection) {
        results.push({
          id: `${frame.collectionId}_${frame.storyNumber}_${frame.frameNumber}`,
          collectionId: frame.collectionId,
          collectionName: collection.displayName,
          storyNumber: frame.storyNumber,
          storyTitle: story.title,
          frameNumber: frame.frameNumber,
          text: frame.text,
          highlightedText: this.highlightSearchTerm(frame.text, query),
        });
      }
    }

    return results;
  }

  private highlightSearchTerm(text: string, term: string): string {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Helper method to extract source reference from content
  private extractSourceReference(content: string): { sourceReference: string | null; cleanedContent: string } {
    const lines = content.split('\n');
    let sourceReference: string | null = null;
    let lastNonBlankLineIndex = -1;
    
    // Find the last non-blank line
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line) {
        lastNonBlankLineIndex = i;
        // Check if the line contains text between underscores
        const sourceReferenceMatch = line.match(/_([^_]+)_/);
        if (sourceReferenceMatch) {
          sourceReference = sourceReferenceMatch[1].trim();
        }
        break; // Stop at the first non-blank line from the end
      }
    }
    
    // If we found a source reference, remove that line from the content
    let cleanedContent = content;
    if (sourceReference !== null && lastNonBlankLineIndex >= 0) {
      const modifiedLines = [...lines];
      modifiedLines[lastNonBlankLineIndex] = ''; // Remove the line with source reference
      cleanedContent = modifiedLines.join('\n').trim();
    }
    
    return { sourceReference, cleanedContent };
  }

  // Delete Operations
  async deleteCollection(id: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      // Clean up user data first (reading progress, markers, comments, etc.)
      await this.cleanupUserDataForCollection(id);

      // Delete from unified database
      await this.databaseManager.deleteCollection(id);

      // Clean up thumbnails
      await this.deleteCollectionThumbnail(id);

      // Note: We intentionally keep repository owner records in the database
      // since they may be shared by other collections and contain valuable metadata

      warn(`✅ Collection ${id} and all associated data deleted successfully`);
    } catch (error) {
      warn(
        `❌ Error deleting collection ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
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
      const progressKeys = keys.filter(
        (key) => key.startsWith('@reading_progress:') && key.includes(collectionId)
      );

      if (progressKeys.length > 0) {
        await AsyncStorage.multiRemove(progressKeys);
        warn(
          `Removed ${progressKeys.length} reading progress entries for collection ${collectionId}`
        );
      }
    } catch (error) {
      warn(
        `Error cleaning up reading progress: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async cleanupUserMarkers(collectionId: string): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const keys = await AsyncStorage.getAllKeys();
      const markerKeys = keys.filter((key) => key.startsWith('@marker:'));

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
      warn(
        `Error cleaning up user markers: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async cleanupRecentlyViewed(collectionId: string): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const keys = await AsyncStorage.getAllKeys();
      const recentlyViewedKeys = keys.filter((key) => key.startsWith('@recently_viewed:'));

      if (recentlyViewedKeys.length > 0) {
        const recentlyViewedEntries = await AsyncStorage.multiGet(recentlyViewedKeys);
        const keysToRemove: string[] = [];

        for (const [key, value] of recentlyViewedEntries) {
          if (value) {
            try {
              const items = JSON.parse(value);
              if (Array.isArray(items)) {
                const filteredItems = items.filter((item) => item.collectionId !== collectionId);
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
      warn(
        `Error cleaning up recently viewed: ${error instanceof Error ? error.message : String(error)}`
      );
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

  // Validation method to check if collection has required structure
  private async validateCollectionStructure(contentsUrl: string): Promise<boolean> {
    try {
      console.log(`Validating collection structure for: ${contentsUrl}`);
      
      const response = await fetch(contentsUrl);
      if (!response.ok) {
        warn(`Failed to fetch contents for validation: ${response.status}`);
        return false;
      }

      const contents = await response.json();
      if (!Array.isArray(contents)) {
        warn('Contents response is not an array');
        return false;
      }

      // Look for an item with path="content" and type="dir"
      const hasContentDir = contents.some(item => 
        item.path === 'content' && item.type === 'dir'
      );

      if (!hasContentDir) {
        warn('Collection does not have required "content" directory structure');
        return false;
      }

      console.log('✅ Collection has valid structure with "content" directory');
      return true;
    } catch (error) {
      warn(`Error validating collection structure: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private async convertRemoteToCollection(remote: RemoteCollection): Promise<{
    collection: Collection;
    ownerData: any;
    isValid: boolean;
  }> {
    const collectionId = `${remote.owner}/${remote.name}`;

    console.log({ remote });

    // Validate collection structure before processing
    const isValid = await this.validateCollectionStructure(remote.contents_url);
    if (!isValid) {
      console.log(`⚠️ Collection ${collectionId} has invalid structure - will show as unavailable`);
    }

    const ownerData = remote.repo?.owner;

    const collection: Collection = {
      id: collectionId,
      owner: {
        username: remote.owner,
        fullName: ownerData?.full_name,
        avatarUrl: ownerData?.avatar_url,
        description: ownerData?.description,
        website: ownerData?.website,
        location: ownerData?.location,
        type: ownerData?.id ? 'user' : undefined, // Simplified type detection
        repositoryLanguages: ownerData?.repo_languages || [],
        repositorySubjects: ownerData?.repo_subjects || [],
      },
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

    return { collection, ownerData, isValid };
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
      const referenceParseRegex = /\[(.*?)\]\((.*?)\)/g;

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

          // Extract source reference from the content
          const { sourceReference, cleanedContent } = this.extractSourceReference(content);
          
          // Prepare story metadata
          const storyMetadata: Record<string, any> = {};
          if (sourceReference) {
            storyMetadata.sourceReference = sourceReference;
          }

          const storyData = this.convertStoryToDb({
            collectionId: collection.id,
            storyNumber,
            title,
            isFavorite: false,
            metadata: Object.keys(storyMetadata).length > 0 ? storyMetadata : undefined,
          });
          await this.databaseManager.saveStory(storyData);

          let frameNumber = 0;
          let match;
          frameParseRegex.lastIndex = 0;
          while ((match = frameParseRegex.exec(cleanedContent)) !== null) {
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

  // Method to check if a collection can be downloaded (has valid structure)
  async canDownloadCollection(collection: Collection): Promise<boolean> {
    try {
      // For remote collections, we need to check the structure
      // Since we don't store validation status in DB, we need to re-validate
      const [owner, repoName] = collection.id.split('/');
      const contentsUrl = `https://git.door43.org/api/v1/repos/${owner}/${repoName}/contents?ref=${collection.version}`;
      
      return await this.validateCollectionStructure(contentsUrl);
    } catch (error) {
      warn(`Error checking if collection ${collection.id} can be downloaded: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  // Download Operations
  async downloadRemoteCollection(collection: Collection, languageData?: any): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    // Check if collection can be downloaded (has valid structure)
    const canDownload = await this.canDownloadCollection(collection);
    if (!canDownload) {
      throw new Error(`Cannot download collection ${collection.id}: Invalid structure - missing required "content" directory`);
    }
    
    try {
      // Save language data FIRST to satisfy foreign key constraints
      await this.saveLanguageData(collection.language, languageData);

      // Use the owner data that's already embedded in the Collection object
      const ownerData = {
        full_name: collection.owner.fullName,
        avatar_url: collection.owner.avatarUrl,
        description: collection.owner.description,
        website: collection.owner.website,
        location: collection.owner.location,
        visibility: 'public',
        ownerType: collection.owner.type || 'user',
        repo_languages: collection.owner.repositoryLanguages || [],
        repo_subjects: collection.owner.repositorySubjects || [],
      };

      // Save repository owner data using the embedded owner data
      await this.saveRepositoryOwnerData(collection.owner.username, ownerData);

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

  private async saveRepositoryOwnerData(ownerUsername: string, ownerData?: any): Promise<void> {
    try {
      // Always try to save/update owner data when available
      if (ownerData) {
        const fullName = ownerData.full_name || ownerData.fullName;

        // Save/update the owner with the latest information
        await this.databaseManager.saveRepositoryOwner({
          username: ownerUsername,
          fullName: fullName || undefined,
          email: ownerData.email || undefined,
          avatarUrl: ownerData.avatar_url || ownerData.avatarUrl || undefined,
          description: ownerData.description || undefined,
          website: ownerData.website || undefined,
          location: ownerData.location || undefined,
          visibility: ownerData.visibility || 'public',
          ownerType: ownerData.ownerType || 'user',
          repositoryLanguages: ownerData.repositoryLanguages || ownerData.repo_languages || [],
          repositorySubjects: ownerData.repositorySubjects || ownerData.repo_subjects || [],
          socialLinks: ownerData.social_links || ownerData.socialLinks || {},
          metadata: {
            bio: ownerData.bio || undefined,
            company: ownerData.company || undefined,
            hireable: ownerData.hireable || undefined,
            publicRepos:
              ownerData.publicRepos ||
              ownerData.public_repos ||
              ownerData.starred_repos_count ||
              undefined,
            publicGists: ownerData.publicGists || ownerData.public_gists || undefined,
            followers: ownerData.followers || ownerData.followers_count || undefined,
            following: ownerData.following || ownerData.following_count || undefined,
            createdAt:
              ownerData.createdAt || ownerData.created_at || ownerData.created || undefined,
            updatedAt: ownerData.updatedAt || ownerData.updated_at || undefined,
            ...ownerData.metadata,
          },
        });
      } else {
        // Only create minimal entry if owner doesn't exist yet
        const existingOwner = await this.databaseManager.getRepositoryOwner(ownerUsername);
        if (!existingOwner) {
          await this.databaseManager.saveRepositoryOwner({
            username: ownerUsername,
            fullName: undefined,
            ownerType: 'user', // Default to user
          });
        }
        // If owner exists, don't overwrite with minimal data
      }
    } catch (error) {
      warn(
        `Error saving repository owner data for ${ownerUsername}: ${error instanceof Error ? error.message : String(error)}`
      );
      // Don't throw error here as owner data saving is not critical for collection download
    }
  }

  // Method to fetch additional owner information from API
  async fetchRepositoryOwnerInfo(ownerUsername: string): Promise<any> {
    try {
      const response = await fetch(`https://git.door43.org/api/v1/users/${ownerUsername}`);
      if (!response.ok) {
        // Try organization endpoint if user endpoint fails
        const orgResponse = await fetch(`https://git.door43.org/api/v1/orgs/${ownerUsername}`);
        if (orgResponse.ok) {
          return await orgResponse.json();
        }
        throw new Error(`Failed to fetch owner info: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      warn(
        `Error fetching owner info for ${ownerUsername}: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  // Enhanced method to download with full owner information
  async downloadRemoteCollectionWithOwnerInfo(
    collection: Collection,
    languageData?: any
  ): Promise<void> {
    // Since Collection already has owner data embedded, just use the standard method
    await this.downloadRemoteCollection(collection, languageData);
  }

  // Owner Information Methods
  async getOwnerDisplayName(ownerUsername: string): Promise<string> {
    if (!this.initialized) await this.initialize();

    try {
      const owner = await this.databaseManager.getRepositoryOwner(ownerUsername);
      if (owner && owner.fullName && owner.fullName.trim() !== '') {
        return owner.fullName;
      }
      return ownerUsername; // Fallback to username
    } catch (error) {
      warn(
        `Error getting owner display name for ${ownerUsername}: ${error instanceof Error ? error.message : String(error)}`
      );
      return ownerUsername; // Fallback to username
    }
  }

  /**
   * Maintenance method to clean up orphaned owner records that have no associated collections.
   * This is optional and can be run periodically to keep the database clean.
   * @returns Number of orphaned owner records that were removed
   */
  async cleanupOrphanedOwners(): Promise<number> {
    if (!this.initialized) await this.initialize();

    try {
      // Get all owners
      const allOwners = await this.databaseManager.searchRepositoryOwners('');
      let removedCount = 0;

      for (const owner of allOwners) {
        // Check if this owner has any collections
        const collections = await this.databaseManager.getCollectionsByOwner(owner.username);

        if (collections.length === 0) {
          // This owner has no collections, remove them
          await this.databaseManager.deleteRepositoryOwner(owner.username);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        warn(`🧹 Cleaned up ${removedCount} orphaned owner records`);
      }

      return removedCount;
    } catch (error) {
      warn(
        `Error cleaning up orphaned owners: ${error instanceof Error ? error.message : String(error)}`
      );
      return 0;
    }
  }

  async getOwnerInfo(ownerUsername: string): Promise<{
    username: string;
    displayName: string;
    avatarUrl?: string;
    website?: string;
    description?: string;
    ownerType: 'user' | 'organization';
    repositoryLanguages: string[];
    repositorySubjects: string[];
  }> {
    if (!this.initialized) await this.initialize();

    try {
      const owner = await this.databaseManager.getRepositoryOwner(ownerUsername);

      if (owner) {
        return {
          username: owner.username,
          displayName:
            owner.fullName && owner.fullName.trim() !== '' ? owner.fullName : owner.username,
          avatarUrl: owner.avatarUrl || undefined,
          website: owner.website || undefined,
          description: owner.description || undefined,
          ownerType: (owner.ownerType === 'organization' ? 'organization' : 'user') as
            | 'user'
            | 'organization',
          repositoryLanguages: owner.repositoryLanguages,
          repositorySubjects: owner.repositorySubjects,
        };
      } else {
        // Return minimal info if owner not found
        return {
          username: ownerUsername,
          displayName: ownerUsername,
          ownerType: 'user',
          repositoryLanguages: [],
          repositorySubjects: [],
        };
      }
    } catch (error) {
      warn(
        `Error getting owner info for ${ownerUsername}: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        username: ownerUsername,
        displayName: ownerUsername,
        ownerType: 'user',
        repositoryLanguages: [],
        repositorySubjects: [],
      };
    }
  }

  async searchOwners(query: string): Promise<
    {
      username: string;
      displayName: string;
      description?: string;
      ownerType: 'user' | 'organization';
      collectionsCount: number;
    }[]
  > {
    if (!this.initialized) await this.initialize();

    try {
      const owners = await this.databaseManager.searchRepositoryOwners(query);
      const results = [];

      for (const owner of owners) {
        // Count collections for this owner
        const collections = await this.databaseManager.getCollectionsByOwner(owner.username);

        results.push({
          username: owner.username,
          displayName:
            owner.fullName && owner.fullName.trim() !== '' ? owner.fullName : owner.username,
          description: owner.description || undefined,
          ownerType: (owner.ownerType === 'organization' ? 'organization' : 'user') as
            | 'user'
            | 'organization',
          collectionsCount: collections.length,
        });
      }

      return results;
    } catch (error) {
      warn(`Error searching owners: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async getCollectionsByOwner(ownerUsername: string): Promise<Collection[]> {
    if (!this.initialized) await this.initialize();

    try {
      const collections = await this.databaseManager.getCollectionsByOwner(ownerUsername);
      const collectionsWithOwnerData: Collection[] = [];

      for (const collection of collections) {
        const owner = await this.databaseManager.getRepositoryOwner(collection.owner);

        collectionsWithOwnerData.push({
          id: collection.id,
          owner: {
            username: collection.owner,
            fullName: owner?.fullName || undefined,
            avatarUrl: owner?.avatarUrl || undefined,
            description: owner?.description || undefined,
            website: owner?.website || undefined,
            location: owner?.location || undefined,
            type: owner?.ownerType as 'user' | 'organization' | undefined,
            repositoryLanguages: owner?.repositoryLanguages || [],
            repositorySubjects: owner?.repositorySubjects || [],
          },
          language: collection.language,
          displayName: collection.displayName,
          version: collection.version,
          imageSetId: collection.imageSetId,
          lastUpdated: new Date(collection.lastUpdated),
          isDownloaded: collection.isDownloaded,
          metadata: collection.metadata || undefined,
        });
      }

      return collectionsWithOwnerData;
    } catch (error) {
      console.error('Error getting collections by owner:', error);
      return [];
    }
  }

  /**
   * Downloads a remote collection using owner data already available from the catalog response.
   * Since Collection objects always have owner data embedded, this is now just an alias
   * to the standard downloadRemoteCollection method.
   *
   * @param collection - Collection to download
   * @param ownerData - Owner data from the catalog response (not used since Collection has embedded data)
   * @param languageData - Optional language data
   */
  async downloadRemoteCollectionFromCatalog(
    collection: Collection,
    ownerData: any,
    languageData?: any
  ): Promise<void> {
    // Since Collection already has owner data embedded, just use the standard method
    await this.downloadRemoteCollection(collection, languageData);
  }
}
