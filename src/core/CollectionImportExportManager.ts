import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';

import { CollectionsManager, Collection, Story, Frame } from './CollectionsManager';
import { DatabaseManager } from './DatabaseManager';
import { UnifiedLanguagesManager } from './UnifiedLanguagesManager';
import { batchSaveStories, batchSaveFrames, extractSourceReference } from './ZipProcessingUtils';
import { ImageManager } from './imageManager';
import { StoryManager } from './storyManager';
import { warn } from './utils';

// Export/Import format version for compatibility checking
const EXPORT_FORMAT_VERSION = '1.0.0';

// Error codes for i18n
export const IMPORT_ERROR_CODES = {
  // Version related errors (1000-1099)
  VERSION_CONFLICT_NEWER: 1000,
  VERSION_CONFLICT_OLDER: 1001,
  VERSION_INCOMPATIBLE: 1002,

  // Duplicate errors (1100-1199)
  DUPLICATE_COLLECTION: 1100,

  // Data validation errors (1200-1299)
  INVALID_MANIFEST: 1200,
  MISSING_MANIFEST: 1201,
  CORRUPTED_DATA: 1202,

  // File system errors (1300-1399)
  FILE_READ_ERROR: 1300,
  FILE_WRITE_ERROR: 1301,

  // User data errors (1400-1499)
  USER_DATA_BACKUP_ERROR: 1400,
  USER_DATA_RESTORE_ERROR: 1401,

  // Unknown errors (1900-1999)
  UNKNOWN_ERROR: 1900,
} as const;

export type ImportErrorCode = (typeof IMPORT_ERROR_CODES)[keyof typeof IMPORT_ERROR_CODES];

// New interface for our custom manifest.json, reflecting database structures
export interface AppExportManifest {
  manifestFormatVersion: string;
  appName: string;
  appVersion: string;
  exportedDate: string;

  collection: {
    id: string;
    owner_username: string;
    language_code: string;
    display_name: string;
    version: string;
    image_set_id: string;
    last_updated_timestamp: string;
    metadata?: {
      // Nested metadata object for collection
      description?: string;
      target_audience?: string;
      publisher?: string;
      rights?: string;
      subject?: string;
      creator?: string;
      issued?: string;
      modified?: string;
      relation?: string[];
      source?: {
        identifier: string;
        language: string;
        version: string;
      }[];
      checking?: {
        checking_entity?: string[];
        checking_level?: string;
      };
    };
  };

  repositoryOwner?: {
    username: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    description?: string; // Direct column
    website?: string;
    location?: string;
    visibility: 'public' | 'private' | string;
    owner_type: 'user' | 'organization' | string;
    repository_languages: string[];
    repository_subjects: string[];
    social_links?: {
      // Direct column, JSON object
      twitter?: string;
      github?: string;
      linkedin?: string;
      facebook?: string;
      mastodon?: string;
    };
    metadata?: {
      // Nested metadata object for repository owner
      bio?: string;
      company?: string;
      hireable?: boolean;
      public_repos?: number;
      public_gists?: number;
      followers?: number;
      following?: number;
      created_at?: string;
      updated_at?: string;
    };
  };

  language: {
    lc: string;
    ln: string;
    ang: string;
    ld: 'ltr' | 'rtl';
    gw: boolean;
    hc: string;
    lr: string;
    pk: number;
    alt: string[];
    cc: string[];
  };
}

export interface ExportManifest {
  version: string;
  exportDate: string;
  appVersion?: string;
  collection: CollectionExportInfo; // Single collection instead of array
  totalSize: number;
  checksum?: string;
}

export interface CollectionExportInfo {
  id: string;
  displayName: string;
  language: string;
  version: string;
  owner: {
    username: string;
    fullName?: string;
    description?: string;
    website?: string;
    location?: string;
    type?: 'user' | 'organization';
  };
  storyCount: number;
  frameCount: number;
  exportSize: number;
}

export interface ExportOptions {
  includeUserData?: boolean; // Include markers, progress, favorites
  includeThumbnails?: boolean; // Include collection thumbnails
  compressionLevel?: number; // 0-9, higher = more compression
  collectionId: string; // Single collection ID to export
}

export interface ImportOptions {
  overwriteExisting?: boolean; // Overwrite existing collections
  skipVersionCheck?: boolean; // Skip version compatibility check
}

export interface ImportResult {
  success: boolean;
  importedCollection?: string;
  errors: ImportError[];
  skipped: boolean;
}

export interface ImportError {
  type:
    | 'VERSION_CONFLICT'
    | 'DUPLICATE_COLLECTION'
    | 'CORRUPTED_DATA'
    | 'MISSING_DEPENDENCIES'
    | 'UNKNOWN_ERROR';
  code: ImportErrorCode;
  message: string;
  canRetry: boolean;
  details?: {
    existingVersion?: string;
    importVersion?: string;
    collectionId?: string;
    collectionName?: string;
    ownerName?: string;
    language?: string;
    recommendation?: 'SKIP' | 'OVERWRITE' | 'MERGE';
    affectedData?: {
      favorites?: boolean;
      comments?: boolean;
      progress?: boolean;
      markers?: boolean;
    };
  };
}

export interface VersionConflict {
  collectionId: string;
  existingVersion: string;
  importVersion: string;
  recommendation: 'SKIP' | 'OVERWRITE' | 'MERGE';
}

export class CollectionImportExportManager {
  private static instance: CollectionImportExportManager;
  private collectionsManager: CollectionsManager;
  private databaseManager: DatabaseManager;
  private imageManager: ImageManager;
  private storyManager: StoryManager;
  private initialized: boolean = false;

  // Cache for getZipDisplayInfo to prevent duplicate processing
  private zipDisplayInfoCache = new Map<string, Promise<any>>();
  private static readonly CACHE_EXPIRY_MS = 30000; // 30 seconds
  private cacheTimestamps = new Map<string, number>();

  // Global processing lock to prevent simultaneous operations
  private processingLock = new Set<string>();

  private constructor() {
    this.collectionsManager = CollectionsManager.getInstance();
    this.databaseManager = DatabaseManager.getInstance();
    this.imageManager = ImageManager.getInstance();
    this.storyManager = StoryManager.getInstance();
  }

  static getInstance(): CollectionImportExportManager {
    if (!CollectionImportExportManager.instance) {
      CollectionImportExportManager.instance = new CollectionImportExportManager();
    }
    return CollectionImportExportManager.instance;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.collectionsManager.initialize();
      await this.databaseManager.initialize();
      await this.imageManager.initialize();
      this.initialized = true;
    }
  }

  // ===== EXPORT FUNCTIONALITY =====

  /**
   * Export a single collection to a compressed archive file using remote-compatible format
   */
  async exportCollection(
    filePath: string,
    options: ExportOptions,
    onProgress?: (progress: number, status: string) => void
  ): Promise<string> {
    if (!this.initialized) await this.initialize();

    try {
      onProgress?.(0, 'Preparing export...');

      const collectionId = options.collectionId;
      // Fetch raw collection data directly from DatabaseManager
      const collectionFromDbRaw = await this.databaseManager.getCollection(collectionId);
      if (!collectionFromDbRaw) {
        throw new Error(`Collection not found in database: ${collectionId}`);
      }

      // owner is a string (username) in the raw collection data from DB
      const ownerUsername = collectionFromDbRaw.owner;

      const ownerDataFromDb = await this.databaseManager.getRepositoryOwner(ownerUsername);

      // Fetch raw stories and frames directly from DatabaseManager
      const storiesFromDb = await this.databaseManager.getStoriesByCollection(collectionId);
      if (!storiesFromDb || storiesFromDb.length === 0) {
        throw new Error(`No stories found in database for collection: ${collectionId}`);
      }

      onProgress?.(20, 'Creating archive...');

      const zip = new JSZip();
      const contentsFolder = zip.folder('content');
      if (!contentsFolder) {
        throw new Error('Failed to create content folder');
      }

      onProgress?.(30, 'Processing stories...');

      for (const storyDb of storiesFromDb) {
        // Map DB story to the Story interface expected by generateStoryContent
        const storyForContent: Story = {
          collectionId: storyDb.collection_id,
          storyNumber: storyDb.story_number,
          title: storyDb.title,
          isFavorite: false,
          metadata: storyDb.metadata ?? undefined,
        };

        const framesFromDb = await this.databaseManager.getFramesByStory(
          collectionId,
          storyDb.story_number
        );
        // Map DB frames to the Frame interface expected by generateStoryContent
        const framesForContent: Frame[] = framesFromDb.map((frameDb) => ({
          collectionId: frameDb.collection_id,
          storyNumber: frameDb.story_number,
          frameNumber: frameDb.frame_number,
          imageUrl: frameDb.image_url,
          text: frameDb.text,
          isFavorite: false,
          metadata: frameDb.metadata ?? undefined,
        }));

        const storyContent = this.generateStoryContent(storyForContent, framesForContent);
        const storyFileName = `${storyDb.story_number.toString().padStart(2, '0')}.md`;
        contentsFolder.file(storyFileName, storyContent);
      }

      onProgress?.(60, 'Processing content metadata...');
      const thumbnail = await this.imageManager.getCollectionThumbnail(collectionId);
      if (thumbnail) {
        contentsFolder.file('thumbnail.jpg', thumbnail, { base64: true });
      }

      onProgress?.(70, 'Gathering collection, owner & language data...');
      const languagesManager = UnifiedLanguagesManager.getInstance();
      await languagesManager.initialize();
      const languageDataFromDb = await languagesManager.getLanguage(collectionFromDbRaw.language);

      let repoOwnerDetails: AppExportManifest['repositoryOwner'] | undefined = undefined;
      if (ownerDataFromDb) {
        repoOwnerDetails = {
          username: ownerDataFromDb.username,
          full_name: ownerDataFromDb.fullName ?? undefined,
          email: ownerDataFromDb.email ?? undefined,
          avatar_url: ownerDataFromDb.avatarUrl ?? undefined,
          description: ownerDataFromDb.description ?? undefined,
          website: ownerDataFromDb.website ?? undefined,
          location: ownerDataFromDb.location ?? undefined,
          visibility: (ownerDataFromDb.visibility ?? 'public') as 'public' | 'private' | string,
          owner_type: (ownerDataFromDb.ownerType ?? 'user') as 'user' | 'organization' | string,
          repository_languages: ownerDataFromDb.repositoryLanguages || [],
          repository_subjects: ownerDataFromDb.repositorySubjects || [],
          social_links: ownerDataFromDb.socialLinks ?? undefined,
          metadata: ownerDataFromDb.metadata
            ? {
                bio: ownerDataFromDb.metadata.bio ?? undefined,
                company: ownerDataFromDb.metadata.company ?? undefined,
                hireable: ownerDataFromDb.metadata.hireable ?? undefined,
                public_repos: ownerDataFromDb.metadata.publicRepos ?? undefined,
                public_gists: ownerDataFromDb.metadata.publicGists ?? undefined,
                followers: ownerDataFromDb.metadata.followers ?? undefined,
                following: ownerDataFromDb.metadata.following ?? undefined,
                created_at: ownerDataFromDb.metadata.createdAt
                  ? new Date(ownerDataFromDb.metadata.createdAt).toISOString()
                  : undefined,
                updated_at: ownerDataFromDb.metadata.updatedAt
                  ? new Date(ownerDataFromDb.metadata.updatedAt).toISOString()
                  : undefined,
              }
            : undefined,
        };
      }

      const manifestData: AppExportManifest = {
        manifestFormatVersion: EXPORT_FORMAT_VERSION,
        appName: 'OBS App',
        appVersion: '1.0.0',
        exportedDate: new Date().toISOString(),
        collection: {
          id: collectionFromDbRaw.id,
          owner_username: ownerUsername,
          language_code: collectionFromDbRaw.language,
          display_name: collectionFromDbRaw.displayName,
          version: collectionFromDbRaw.version,
          image_set_id: collectionFromDbRaw.imageSetId,
          last_updated_timestamp: new Date(collectionFromDbRaw.lastUpdated).toISOString(),
          metadata: collectionFromDbRaw.metadata
            ? {
                description: collectionFromDbRaw.metadata.description,
                target_audience: collectionFromDbRaw.metadata.targetAudience,
                publisher: collectionFromDbRaw.metadata.publisher,
                rights: collectionFromDbRaw.metadata.rights,
                subject: collectionFromDbRaw.metadata.subject,
                creator: collectionFromDbRaw.metadata.creator,
                issued: collectionFromDbRaw.metadata.issued
                  ? new Date(collectionFromDbRaw.metadata.issued).toISOString()
                  : undefined,
                modified: collectionFromDbRaw.metadata.modified
                  ? new Date(collectionFromDbRaw.metadata.modified).toISOString()
                  : undefined,
                relation: collectionFromDbRaw.metadata.relation,
                source: collectionFromDbRaw.metadata.source,
                checking: collectionFromDbRaw.metadata.checking
                  ? {
                      checking_entity: collectionFromDbRaw.metadata.checking.checkingEntity,
                      checking_level: collectionFromDbRaw.metadata.checking.checkingLevel,
                    }
                  : undefined,
              }
            : undefined,
        },
        repositoryOwner: repoOwnerDetails,
        language: {
          lc: languageDataFromDb?.lc || collectionFromDbRaw.language,
          ln: languageDataFromDb?.ln || collectionFromDbRaw.displayName,
          ang: languageDataFromDb?.ang || '',
          ld: (languageDataFromDb?.ld === 'rtl' ? 'rtl' : 'ltr') as 'ltr' | 'rtl',
          gw: languageDataFromDb?.gw || false,
          hc: languageDataFromDb?.hc || '',
          lr: languageDataFromDb?.lr || '',
          pk: languageDataFromDb?.pk || 0,
          alt: languageDataFromDb?.alt || [],
          cc: languageDataFromDb?.cc || [],
        },
      };

      console.log('Export Manifest Data:', JSON.stringify(manifestData, null, 2));
      zip.file('manifest.json', JSON.stringify(manifestData, null, 2));
      onProgress?.(90, 'Compressing archive...');

      // Generate zip file as binary data
      const zipContent = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: {
          level: options.compressionLevel || 6,
        },
      });

      onProgress?.(95, 'Saving file...');

      // Convert Uint8Array to base64 string
      const base64Content = btoa(String.fromCharCode.apply(null, Array.from(zipContent)));

      // Save the zip file as base64
      await FileSystem.writeAsStringAsync(filePath, base64Content, {
        encoding: FileSystem.EncodingType.Base64,
      });

      onProgress?.(100, 'Export complete!');

      console.log(`✅ Export completed: ${filePath}`);

      // Return the actual file path that was used
      return filePath;
    } catch (error) {
      warn(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Legacy method for backward compatibility - now exports single collection
  async exportCollections(
    filePath: string,
    options: ExportOptions,
    onProgress?: (progress: number, status: string) => void
  ): Promise<string> {
    return this.exportCollection(filePath, options, onProgress);
  }

  /**
   * Generate story content in remote format
   */
  private generateStoryContent(story: Story, frames: Frame[]): string {
    let content = `# ${story.title}\n\n`;

    // Process all frames except the last one
    for (let i = 0; i < frames.length - 1; i++) {
      const frame = frames[i];
      content += `![OBS Image](${frame.imageUrl})\n\n`;
      content += `${frame.text}\n\n`;
    }

    // Add the last frame with source reference
    if (frames.length > 0) {
      const lastFrame = frames[frames.length - 1];
      content += `![OBS Image](${lastFrame.imageUrl})\n\n`;
      content += `${lastFrame.text}\n\n`;
      // Add source reference from story metadata
      if (story.metadata?.sourceReference) {
        content += `_${story.metadata.sourceReference}_\n`;
      }
    }

    return content;
  }

  /**
   * Export user data (markers, progress, favorites) for a collection
   */
  private async exportUserDataForCollection(collectionId: string): Promise<any> {
    const userData: any = {
      markers: [],
      progress: [],
      preferences: {},
    };

    try {
      // Get all markers for this collection
      const allMarkers = await this.storyManager.getAllMarkers();
      userData.markers = allMarkers.filter((marker) => marker.collectionId === collectionId);

      // Get all reading progress for this collection
      const allProgress = await this.storyManager.getAllReadingProgress();
      userData.progress = allProgress.filter((progress) => progress.collectionId === collectionId);

      // Get user preferences (font size, reading mode, etc.)
      const fontSizePreference = await AsyncStorage.getItem('fontSizePreference');
      const readingModePreference = await AsyncStorage.getItem('readingModePreference');

      userData.preferences = {
        fontSize: fontSizePreference,
        readingMode: readingModePreference,
      };

      return userData;
    } catch (error) {
      warn(`Error exporting user data for ${collectionId}: ${error}`);
      return null;
    }
  }

  // ===== IMPORT FUNCTIONALITY =====

  /**
   * Optimized import method with batch operations for better performance
   */
  async importCollectionOptimized(
    filePath: string,
    options: ImportOptions,
    onProgress?: (progress: number, status: string) => void
  ): Promise<ImportResult> {
    if (!this.initialized) await this.initialize();

    const result: ImportResult = {
      success: false,
      importedCollection: undefined,
      errors: [],
      skipped: false,
    };

    let manifest: AppExportManifest | undefined;

    try {
      onProgress?.(0, 'Reading import file...');

      let actualFilePath = filePath;

      // Handle content URIs by copying to cache first (same logic as processZipFile)
      if (filePath.startsWith('content://')) {
        console.log('📥 Import: Content URI detected, copying to cache...');
        console.log('📥 Import: Original URI for copyAsync:', filePath);
        try {
          const { StorageAccessFramework } = await import('expo-file-system');

          // Create a unique filename for the cache
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substr(2, 9);
          const cacheFileName = `temp_import_${timestamp}_${randomString}.obs`;
          const cacheFilePath = `${FileSystem.cacheDirectory}${cacheFileName}`;

          // For content URIs, we need to reconstruct the properly encoded URI
          let sourceUri = filePath;

          // Check if the URI has been decoded (contains colons and slashes in the path)
          if (filePath.includes('primary:Documents/')) {
            // Re-encode the path part to restore the original Android content URI format
            sourceUri = filePath.replace('primary:Documents/', 'primary%3ADocuments%2F');
            console.log('📥 Import: Re-encoded URI for Android:', sourceUri);
          }

          // Copy the content URI to cache
          await StorageAccessFramework.copyAsync({
            from: sourceUri,
            to: cacheFilePath,
          });

          actualFilePath = cacheFilePath;
          console.log('📥 Import: File copied to cache:', actualFilePath);
        } catch (copyError) {
          console.error('📥 Import: Failed to copy content URI to cache:', copyError);
          throw new Error('Could not access file: Permission denied or file not found');
        }
      }

      // Optimized ZIP file reading - read as base64 in one go
      const zipContent = await FileSystem.readAsStringAsync(actualFilePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      onProgress?.(5, 'Processing archive...');

      // Load ZIP with streaming option for better memory usage
      const zip = await JSZip.loadAsync(zipContent, {
        base64: true,
        createFolders: false, // Don't create folder objects, saves memory
      });

      onProgress?.(10, 'Validating import file...');

      // Read and validate manifest.json
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) {
        throw new Error('Invalid import file: missing manifest.json');
      }

      manifest = JSON.parse(await manifestFile.async('text'));

      if (!manifest) {
        throw new Error('Failed to parse manifest.json');
      }

      // Version compatibility and conflict checking (same as original)
      if (!options.skipVersionCheck && !this.isVersionCompatible(manifest.manifestFormatVersion)) {
        throw new Error(`Incompatible export format version: ${manifest.manifestFormatVersion}`);
      }

      const existingCollection = await this.databaseManager.getCollection(manifest.collection.id);
      if (existingCollection) {
        const comparison = this.compareVersions(
          existingCollection.version,
          manifest.collection.version
        );

        if (comparison !== 0 && !options.overwriteExisting) {
          result.skipped = true;
          result.errors.push({
            type: 'VERSION_CONFLICT',
            code:
              comparison > 0
                ? IMPORT_ERROR_CODES.VERSION_CONFLICT_OLDER
                : IMPORT_ERROR_CODES.VERSION_CONFLICT_NEWER,
            message: `Version conflict detected for collection "${manifest.collection.display_name}"`,
            canRetry: true,
            details: {
              existingVersion: existingCollection.version,
              importVersion: manifest.collection.version,
              collectionId: manifest.collection.id,
              collectionName: manifest.collection.display_name,
              ownerName: manifest.repositoryOwner?.full_name || manifest.collection.owner_username,
              language: manifest.collection.language_code,
              recommendation: comparison > 0 ? 'SKIP' : 'OVERWRITE',
            },
          });
          return result;
        }

        if (comparison > 0) {
          result.errors.push({
            type: 'VERSION_CONFLICT',
            code: IMPORT_ERROR_CODES.VERSION_CONFLICT_OLDER,
            message: `Warning: Importing older version over newer version`,
            canRetry: true,
            details: {
              existingVersion: existingCollection.version,
              importVersion: manifest.collection.version,
              collectionId: manifest.collection.id,
              collectionName: manifest.collection.display_name,
              ownerName: manifest.repositoryOwner?.full_name || manifest.collection.owner_username,
              language: manifest.collection.language_code,
              recommendation: 'SKIP',
            },
          });
        }

        if (existingCollection && comparison === 0 && !options.overwriteExisting) {
          result.skipped = true;
          result.errors.push({
            type: 'DUPLICATE_COLLECTION',
            code: IMPORT_ERROR_CODES.DUPLICATE_COLLECTION,
            message: `Collection already exists with the same version`,
            canRetry: true,
            details: {
              existingVersion: existingCollection.version,
              importVersion: manifest.collection.version,
              collectionId: manifest.collection.id,
              collectionName: manifest.collection.display_name,
              ownerName: manifest.repositoryOwner?.full_name || manifest.collection.owner_username,
              language: manifest.collection.language_code,
              recommendation: 'SKIP',
            },
          });
          return result;
        }
      }

      onProgress?.(20, 'Preparing import...');

      // Save repository owner and language first (same as original)
      if (manifest.repositoryOwner) {
        await this.databaseManager.saveRepositoryOwner({
          username: manifest.repositoryOwner.username,
          fullName: manifest.repositoryOwner.full_name,
          email: manifest.repositoryOwner.email,
          avatarUrl: manifest.repositoryOwner.avatar_url,
          description: manifest.repositoryOwner.description,
          website: manifest.repositoryOwner.website,
          location: manifest.repositoryOwner.location,
          visibility: manifest.repositoryOwner.visibility,
          ownerType: manifest.repositoryOwner.owner_type,
          repositoryLanguages: manifest.repositoryOwner.repository_languages,
          repositorySubjects: manifest.repositoryOwner.repository_subjects,
          socialLinks: manifest.repositoryOwner.social_links,
          metadata: manifest.repositoryOwner.metadata,
        });
      }

      await this.databaseManager.saveLanguage({
        lc: manifest.language.lc,
        ln: manifest.language.ln,
        ang: manifest.language.ang,
        ld: manifest.language.ld,
        gw: manifest.language.gw,
        hc: manifest.language.hc,
        lr: manifest.language.lr,
        pk: manifest.language.pk,
        alt: manifest.language.alt,
        cc: manifest.language.cc,
      });

      await this.databaseManager.saveCollection({
        id: manifest.collection.id,
        owner: manifest.collection.owner_username,
        language: manifest.collection.language_code,
        displayName: manifest.collection.display_name,
        version: manifest.collection.version,
        imageSetId: manifest.collection.image_set_id,
        lastUpdated: manifest.collection.last_updated_timestamp,
        isDownloaded: true,
        metadata: manifest.collection.metadata
          ? {
              description: manifest.collection.metadata.description,
              targetAudience: manifest.collection.metadata.target_audience,
              publisher: manifest.collection.metadata.publisher,
              rights: manifest.collection.metadata.rights,
              subject: manifest.collection.metadata.subject,
              creator: manifest.collection.metadata.creator,
              issued: manifest.collection.metadata.issued,
              modified: manifest.collection.metadata.modified,
              relation: manifest.collection.metadata.relation,
              source: manifest.collection.metadata.source,
              checking: manifest.collection.metadata.checking
                ? {
                    checkingEntity: manifest.collection.metadata.checking.checking_entity,
                    checkingLevel: manifest.collection.metadata.checking.checking_level,
                  }
                : undefined,
            }
          : undefined,
      });

      onProgress?.(30, 'Processing stories...');

      // OPTIMIZATION: Batch collect all stories and frames first
      const storiesFolder = zip.folder('content');
      if (!storiesFolder) {
        throw new Error('Invalid import file: missing content folder');
      }

      const storyFileRegex = /(?:^|\/)(?:content\/|ingredients\/)?(\d+)\.md$/i;
      const frameParseRegex =
        /!\[[^\]]*?\]\(([^)]+?)\)\s*([\s\S]*?)(?=(?:!\[[^\]]*?\]\([^)]+?\))|$)/g;

      const filesToProcess = Object.entries(storiesFolder.files);
      const allStories: any[] = [];
      const allFrames: any[] = [];
      let processedFiles = 0;

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

          const title = titleFromContent || `Story ${storyNumber}`;
          const { sourceReference, cleanedContent } = this.extractSourceReference(content);

          const storyMetadata: Record<string, any> = {};
          if (sourceReference) {
            storyMetadata.sourceReference = sourceReference;
          }

          // Collect story data
          allStories.push({
            collection_id: manifest.collection.id,
            story_number: storyNumber,
            title,
            is_favorite: false,
            metadata: Object.keys(storyMetadata).length > 0 ? storyMetadata : undefined,
          });

          // Process frames for this story
          let frameNumber = 0;
          let match;
          frameParseRegex.lastIndex = 0;
          while ((match = frameParseRegex.exec(cleanedContent)) !== null) {
            frameNumber++;
            const imageUrl = match[1].trim();
            const frameText = match[2].trim();
            if (!imageUrl || !frameText) {
              warn(
                `Skipping empty frame ${frameNumber} in story ${storyNumber} of ${manifest.collection.id}`
              );
              continue;
            }

            // Collect frame data
            allFrames.push({
              collection_id: manifest.collection.id,
              story_number: storyNumber,
              frame_number: frameNumber,
              image_url: imageUrl,
              text: frameText,
              is_favorite: false,
              metadata: {},
            });
          }

          processedFiles++;
          onProgress?.(
            30 + Math.floor((processedFiles / filesToProcess.length) * 40),
            `Processed ${processedFiles} of ${filesToProcess.length} stories`
          );
        }
      }

      onProgress?.(70, 'Saving to database...');

      // OPTIMIZATION: Batch save all stories and frames
      await batchSaveStories(allStories);

      onProgress?.(75, 'Saving frames...');
      await batchSaveFrames(allFrames, (progress: number) => {
        onProgress?.(75 + Math.floor(progress * 0.15), `Saving frames... ${Math.round(progress)}%`);
      });

      onProgress?.(90, 'Processing thumbnail...');

      // Import thumbnail if available
      const thumbnailFile = zip.file('content/thumbnail.jpg');
      if (thumbnailFile) {
        const thumbnailData = await thumbnailFile.async('base64');
        await this.imageManager.saveCollectionThumbnail(manifest.collection.id, thumbnailData);
      }

      result.importedCollection = manifest.collection.id;
      result.success = true;
      onProgress?.(100, 'Import complete!');
    } catch (error) {
      // Error handling (same as original)
      const errorDetails = manifest
        ? {
            collectionId: manifest.collection.id,
            collectionName: manifest.collection.display_name,
            ownerName: manifest.repositoryOwner?.full_name || manifest.collection.owner_username,
            language: manifest.collection.language_code,
          }
        : undefined;

      let errorCode: ImportErrorCode = IMPORT_ERROR_CODES.UNKNOWN_ERROR;
      if (error instanceof Error) {
        if (error.message.includes('manifest.json')) {
          errorCode = IMPORT_ERROR_CODES.MISSING_MANIFEST;
        } else if (error.message.includes('parse')) {
          errorCode = IMPORT_ERROR_CODES.INVALID_MANIFEST;
        } else if (error.message.includes('read')) {
          errorCode = IMPORT_ERROR_CODES.FILE_READ_ERROR;
        }
      }

      result.errors.push({
        type: 'UNKNOWN_ERROR',
        code: errorCode,
        message: error instanceof Error ? error.message : String(error),
        canRetry: false,
        details: errorDetails,
      });
      warn(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Extract source reference from story content (using shared utility)
   */
  private extractSourceReference = extractSourceReference;

  // ===== UTILITY METHODS =====

  /**
   * Check version compatibility
   */
  private isVersionCompatible(exportVersion: string): boolean {
    // For now, we only support the same version
    // In the future, you could implement more sophisticated version checking
    return exportVersion === EXPORT_FORMAT_VERSION;
  }

  /**
   * Detect version conflicts between import and existing collections
   */
  private async detectVersionConflicts(
    collectionInfo: { id: string; version: string },
    options: ImportOptions
  ): Promise<VersionConflict[]> {
    const conflicts: VersionConflict[] = [];

    const existingCollection = await this.collectionsManager.getCollection(collectionInfo.id);
    if (existingCollection) {
      // Compare versions
      const comparison = this.compareVersions(existingCollection.version, collectionInfo.version);

      if (comparison !== 0) {
        conflicts.push({
          collectionId: collectionInfo.id,
          existingVersion: existingCollection.version,
          importVersion: collectionInfo.version,
          recommendation: comparison > 0 ? 'SKIP' : 'OVERWRITE',
        });
      }
    }

    return conflicts;
  }

  /**
   * Compare two version strings
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }

  /**
   * Calculate checksum for manifest validation
   */
  private async calculateManifestChecksum(collections: CollectionExportInfo[]): Promise<string> {
    // Simple checksum calculation - in production you'd want something more robust
    const data = JSON.stringify(collections.map((c) => ({ id: c.id, version: c.version })));
    let hash = 0;

    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }

  /**
   * Calculate MD5 for content validation
   */
  private calculateMD5(data: string): string {
    // Simple hash function for checksums (not cryptographically secure)
    // In production, you might want to use a proper MD5 library
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to hex and pad to simulate MD5 format
    const hex = Math.abs(hash).toString(16);
    return hex.padStart(32, '0').substring(0, 32);
  }

  /**
   * Get export info for collections without actually exporting
   */
  async getExportInfo(collectionIds: string[]): Promise<ExportManifest> {
    if (!this.initialized) await this.initialize();

    const exportInfo: CollectionExportInfo[] = [];
    let totalSize = 0;

    for (const collectionId of collectionIds) {
      try {
        const collection = await this.collectionsManager.getCollection(collectionId);
        if (collection) {
          const stories = await this.collectionsManager.getCollectionStories(collectionId);
          let frameCount = 0;

          for (const story of stories) {
            const frames = await this.collectionsManager.getStoryFrames(
              collectionId,
              story.storyNumber
            );
            frameCount += frames.length;
          }

          const estimatedSize = this.estimateCollectionSize(collection, stories.length, frameCount);

          exportInfo.push({
            id: collectionId,
            displayName: collection.displayName,
            language: collection.language,
            version: collection.version,
            owner: {
              username: collection.owner.username,
              fullName: collection.owner.fullName,
              description: collection.owner.description,
              website: collection.owner.website,
              location: collection.owner.location,
              type: collection.owner.type,
            },
            storyCount: stories.length,
            frameCount,
            exportSize: estimatedSize,
          });

          totalSize += estimatedSize;
        }
      } catch (error) {
        warn(`Error getting export info for ${collectionId}: ${error}`);
      }
    }

    return {
      version: EXPORT_FORMAT_VERSION,
      exportDate: new Date().toISOString(),
      collection: exportInfo[0],
      totalSize,
    };
  }

  /**
   * Estimate the size of a collection export (without images since they're bundled)
   */
  private estimateCollectionSize(
    collection: Collection,
    storyCount: number,
    frameCount: number
  ): number {
    // Rough estimation based on typical data sizes (excluding images)
    let size = 0;

    // Collection metadata
    size += JSON.stringify(collection).length;

    // Story files (estimated 500 bytes per story in markdown format)
    size += storyCount * 500;

    // Frame content (estimated 150 bytes per frame for text in markdown)
    size += frameCount * 150;

    // Thumbnail (if present)
    size += 5000; // Estimated 5KB for thumbnail

    return size;
  }

  /**
   * Create a test collection with scope information
   */
  async createTestCollection(): Promise<void> {
    if (!this.initialized) await this.initialize();

    const testCollectionId = 'test/obs-en';
    const testCollection = {
      id: testCollectionId,
      owner: 'test',
      language: 'en',
      displayName: 'Test OBS Collection',
      version: '1.0.0',
      imageSetId: 'default',
      lastUpdated: new Date().toISOString(),
      isDownloaded: true,
      metadata: {
        description: 'Test collection with scope information',
        rights: 'CC BY-SA 4.0',
      },
    };

    // Save collection
    await this.databaseManager.saveCollection(testCollection);

    // Create test stories with scope
    const testStories = [
      {
        collection_id: testCollectionId,
        story_number: 1,
        title: 'The Creation',
        is_favorite: false,
        metadata: {
          scope: {
            GEN: ['1-2'],
          },
        },
      },
      {
        collection_id: testCollectionId,
        story_number: 2,
        title: 'The Fall',
        is_favorite: false,
        metadata: {
          scope: {
            GEN: ['3'],
          },
        },
      },
    ];

    // Save stories
    for (const story of testStories) {
      await this.databaseManager.saveStory(story);

      // Add frames for each story
      await this.databaseManager.saveFrame({
        collection_id: testCollectionId,
        story_number: story.story_number,
        frame_number: 1,
        image_url: 'frame1.jpg',
        text: 'This is a test frame for ' + story.title,
        is_favorite: false,
        metadata: {},
      });
    }

    // Save thumbnail
    await this.imageManager.saveCollectionThumbnail(testCollectionId, 'test-thumbnail.jpg');
  }

  /**
   * Test export with scope information
   */
  async testExportWithScope(filePath: string): Promise<string> {
    await this.createTestCollection();

    const options: ExportOptions = {
      collectionId: 'test/obs-en',
      compressionLevel: 6,
    };

    return await this.exportCollection(filePath, options, (progress, status) => {
      console.log(`Export progress: ${progress}% - ${status}`);
    });
  }

  /**
   * Test import with scope information
   */
  async testImportWithScope(filePath: string): Promise<ImportResult> {
    const options: ImportOptions = {
      overwriteExisting: true,
    };

    return this.importCollectionOptimized(filePath, options, (progress, status) => {
      console.log(`Import progress: ${progress}% - ${status}`);
    });
  }

  /**
   * Get display information from a zip file without importing it
   */
  async getZipDisplayInfo(filePath: string): Promise<{
    collectionName: string;
    ownerName: string;
    version: string;
    language: string;
    storyCount: number;
    exportDate: string;
  } | null> {
    console.log('getZipDisplayInfo called with filePath:', filePath);

    // Check if already processing this exact file
    if (this.processingLock.has(filePath)) {
      console.log('🔒 File already being processed, waiting for existing operation:', filePath);
      // Wait for existing operation to complete by checking cache periodically
      let attempts = 0;
      while (this.processingLock.has(filePath) && attempts < 30) {
        // Max 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      // If still processing after timeout, proceed anyway
      if (this.processingLock.has(filePath)) {
        console.log('⚠️ Processing timeout, removing lock and proceeding:', filePath);
        this.processingLock.delete(filePath);
      }
    }

    // Check cache first
    const now = Date.now();
    const cacheKey = filePath;
    const cachedTimestamp = this.cacheTimestamps.get(cacheKey);

    if (
      this.zipDisplayInfoCache.has(cacheKey) &&
      cachedTimestamp &&
      now - cachedTimestamp < CollectionImportExportManager.CACHE_EXPIRY_MS
    ) {
      console.log('🎯 Using cached result for:', filePath);
      return this.zipDisplayInfoCache.get(cacheKey)!;
    }

    // Clear expired cache entries
    this.clearExpiredCache();

    // Add to processing lock
    this.processingLock.add(filePath);

    try {
      // Create new promise for this file
      const processingPromise = this.processZipFile(filePath);
      this.zipDisplayInfoCache.set(cacheKey, processingPromise);
      this.cacheTimestamps.set(cacheKey, now);

      const result = await processingPromise;
      return result;
    } finally {
      // Always remove from processing lock
      this.processingLock.delete(filePath);
    }
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cacheTimestamps.forEach((timestamp, key) => {
      if (now - timestamp >= CollectionImportExportManager.CACHE_EXPIRY_MS) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => {
      this.zipDisplayInfoCache.delete(key);
      this.cacheTimestamps.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.log('🧹 Cleared', expiredKeys.length, 'expired cache entries');
    }
  }

  /**
   * Process zip file and extract display information
   */
  private async processZipFile(filePath: string): Promise<{
    collectionName: string;
    ownerName: string;
    version: string;
    language: string;
    storyCount: number;
    exportDate: string;
  } | null> {
    try {
      let actualFilePath = filePath;

      // Handle content URIs by copying to cache first
      if (filePath.startsWith('content://')) {
        console.log('Content URI detected, copying to cache...');
        console.log('Original URI for copyAsync:', filePath);
        try {
          const { StorageAccessFramework } = await import('expo-file-system');

          // Create a unique filename for the cache
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substr(2, 9);
          const cacheFileName = `temp_import_${timestamp}_${randomString}.obs`;
          const cacheFilePath = `${FileSystem.cacheDirectory}${cacheFileName}`;

          // For content URIs, we need to reconstruct the properly encoded URI
          // The issue is that we're receiving a decoded URI, but Android expects the original encoded format
          let sourceUri = filePath;

          // Check if the URI has been decoded (contains colons and slashes in the path)
          if (filePath.includes('primary:Documents/')) {
            // Re-encode the path part to restore the original Android content URI format
            sourceUri = filePath.replace('primary:Documents/', 'primary%3ADocuments%2F');
            console.log('Re-encoded URI for Android:', sourceUri);
          }

          // Copy the content URI to cache
          await StorageAccessFramework.copyAsync({
            from: sourceUri,
            to: cacheFilePath,
          });

          actualFilePath = cacheFilePath;
          console.log('File copied to cache:', actualFilePath);
        } catch (copyError) {
          console.error('Failed to copy content URI to cache:', copyError);
          throw new Error('Could not access file: Permission denied or file not found');
        }
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(actualFilePath);
      console.log('File exists:', fileInfo.exists);
      console.log('File info:', fileInfo);

      if (!fileInfo.exists) {
        console.log('File does not exist:', actualFilePath);
        throw new Error('File not found');
      }

      // Read the zip file as base64
      console.log('Reading file as base64...');
      const zipContent = await FileSystem.readAsStringAsync(actualFilePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('Zip content length:', zipContent.length);
      console.log('First 100 chars of zip content:', zipContent.substring(0, 100));

      // Convert base64 to Uint8Array
      const binaryString = atob(zipContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log('Loading zip with JSZip...');
      const zip = await JSZip.loadAsync(bytes);
      console.log('Zip loaded successfully');
      console.log('Zip files:', Object.keys(zip.files));

      const manifestFile = zip.file('manifest.json');
      console.log('Manifest file found:', !!manifestFile);

      if (!manifestFile) {
        console.log('No manifest.json found in zip file');
        throw new Error('Invalid OBS file: Missing manifest.json');
      }

      console.log('Reading manifest content...');
      const manifestContent = await manifestFile.async('text');
      console.log('Manifest content:', manifestContent);

      const manifest: AppExportManifest = JSON.parse(manifestContent);
      console.log('Manifest parsed successfully');

      // Count story files
      const storyCount = Object.keys(zip.files).filter(
        (name) => name.startsWith('content/') && name.endsWith('.md')
      ).length;

      const result = {
        collectionName: manifest.collection.display_name,
        ownerName: manifest.repositoryOwner?.full_name || manifest.collection.owner_username,
        version: manifest.collection.version,
        language: manifest.collection.language_code,
        storyCount,
        exportDate: manifest.exportedDate,
      };

      console.log('Display info result:', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to read display info:', errorMessage);

      // Remove from cache on error
      this.zipDisplayInfoCache.delete(filePath);
      this.cacheTimestamps.delete(filePath);

      return null;
    }
  }

  /**
   * List all importable collections in a directory
   */
  async listImportableCollections(directoryPath: string): Promise<
    {
      fileName: string;
      displayInfo: {
        collectionName: string;
        ownerName: string;
        version: string;
        language: string;
        storyCount: number;
        exportDate: string;
      };
    }[]
  > {
    try {
      const files = await FileSystem.readDirectoryAsync(directoryPath);
      const importableCollections: {
        fileName: string;
        displayInfo: any;
      }[] = [];

      for (const file of files) {
        if (file.endsWith('.zip')) {
          const filePath = `${directoryPath}/${file}`;
          const displayInfo = await this.getZipDisplayInfo(filePath);
          if (displayInfo) {
            importableCollections.push({
              fileName: file,
              displayInfo,
            });
          }
        }
      }

      return importableCollections;
    } catch (error) {
      warn(
        `Failed to list importable collections: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  /**
   * Backup user data before collection deletion
   */
  private async backupUserData(collectionId: string): Promise<any> {
    try {
      const userData = {
        favorites: {
          stories: await this.databaseManager
            .getFavoriteStories()
            .then((stories) => stories.filter((s) => s.collection_id === collectionId)),
          frames: await this.databaseManager
            .getFavoriteFrames()
            .then((frames) => frames.filter((f) => f.collection_id === collectionId)),
        },
        comments: await this.databaseManager.getFrameComments(collectionId, 0, 0),
        progress: await this.storyManager
          .getAllReadingProgress()
          .then((progress) => progress.filter((p) => p.collectionId === collectionId)),
        markers: await this.storyManager
          .getAllMarkers()
          .then((markers) => markers.filter((m) => m.collectionId === collectionId)),
      };
      return userData;
    } catch (error) {
      warn(`Error backing up user data: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Restore user data after collection import
   */
  private async restoreUserData(collectionId: string, userData: any): Promise<void> {
    try {
      // Restore favorites
      for (const story of userData.favorites.stories) {
        await this.databaseManager.toggleStoryFavorite(collectionId, story.story_number);
      }
      for (const frame of userData.favorites.frames) {
        await this.databaseManager.toggleFrameFavorite(
          collectionId,
          frame.story_number,
          frame.frame_number
        );
      }

      // Restore comments
      for (const comment of userData.comments) {
        await this.databaseManager.addComment({
          collection_id: collectionId,
          story_number: comment.story_number,
          frame_number: comment.frame_number,
          comment: comment.comment,
        });
      }

      // Restore progress
      for (const progress of userData.progress) {
        await this.storyManager.saveReadingProgress(
          collectionId,
          progress.storyNumber,
          progress.frameNumber,
          progress.timestamp
        );
      }

      // Restore markers
      for (const marker of userData.markers) {
        await this.storyManager.addMarker(
          collectionId,
          marker.storyNumber,
          marker.frameNumber,
          marker.note,
          marker.color
        );
      }
    } catch (error) {
      warn(`Error restoring user data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
