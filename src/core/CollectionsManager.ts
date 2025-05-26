import * as SQLite from 'expo-sqlite';
import JSZip from 'jszip';
// Language and LanguageItem seem unused in this file, consider removing if not needed elsewhere via this export
// import { Language, LanguageItem } from 'types/index';

import { ImageManager } from './imageManager';
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
  rawContentMd?: string | null; // Optional: Store full markdown of the story
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

export class CollectionsManager {
  private static instance: CollectionsManager;
  private db!: SQLite.SQLiteDatabase; // Definite assignment assertion
  private collections: Map<string, Collection> = new Map();
  private imagesManager: ImageManager;
  private initialized: boolean = false;

  private constructor() {
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
      this.db = await SQLite.openDatabaseAsync('collections.db'); // Changed DB name to avoid conflicts during migration
      await this.db.execAsync('PRAGMA foreign_keys = OFF;'); // Enable foreign key enforcement
      await this.createTables();
      await this.loadCollections();
      this.initialized = true;
    }
  }

  // V2 Table Creation
  private async createTables(): Promise<void> {
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        owner TEXT NOT NULL,
        language TEXT NOT NULL,
        displayName TEXT NOT NULL,
        version TEXT NOT NULL,
        imageSetId TEXT NOT NULL,
        lastUpdated TEXT NOT NULL,
        isDownloaded INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS stories (
        collection_id TEXT NOT NULL,
        story_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        raw_content_md TEXT,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        metadata TEXT,
        PRIMARY KEY (collection_id, story_number),
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS frames (
        collection_id TEXT NOT NULL,
        story_number INTEGER NOT NULL,
        frame_number INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        text TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        metadata TEXT,
        PRIMARY KEY (collection_id, story_number, frame_number),
        FOREIGN KEY (collection_id, story_number) REFERENCES stories(collection_id, story_number) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS collection_files (
        collection_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        content TEXT NOT NULL,
        PRIMARY KEY (collection_id, filename),
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
      );
    `);
  }

  // Remote Operations
  async getRemoteLanguages(): Promise<any[]> {
    // Replaced LanguageItem with any as it's not defined
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
      console.log({ data });
      return (data || []).map((item: RemoteCollection) => this.convertRemoteToCollection(item));
    } catch (error) {
      warn(
        `Error searching collections: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  async downloadRemoteCollection(collection: Collection): Promise<void> {
    if (!this.initialized) await this.initialize();
    try {
      const [owner, repoName] = collection.id.split('/');
      const zipballUrl = `https://git.door43.org/${owner}/${repoName}/archive/${collection.version}.zip`;
      const response = await fetch(zipballUrl);

      if (!response.ok) {
        throw new Error(`Failed to download collection ${collection.id}: ${response.status}`);
      }

      const zipData = await response.arrayBuffer();

      await this.processAndStoreZip(collection, zipData); // Use V2 processor

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

  // Local Operations
  async getLocalCollections(): Promise<Collection[]> {
    if (!this.initialized) await this.initialize();
    return Array.from(this.collections.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }

  async getLocalCollectionsByLanguage(language: string): Promise<Collection[]> {
    if (!this.initialized) await this.initialize();
    return Array.from(this.collections.values())
      .filter((c) => c.language === language)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async getLocalLanguages(): Promise<string[]> {
    if (!this.initialized) await this.initialize();
    const languages = new Set<string>();
    this.collections.forEach((c) => {
      if (c.isDownloaded) {
        languages.add(c.language);
      }
    });
    return Array.from(languages).sort();
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    if (!this.initialized) await this.initialize();
    return this.collections.get(id) || null;
  }

  // V2 Story/Frame Methods
  async getCollectionStories(collectionId: string): Promise<Story[]> {
    if (!this.initialized) await this.initialize();
    try {
      const rows = await this.db.getAllAsync<any>( // any for row type
        'SELECT * FROM stories WHERE collection_id = ? ORDER BY story_number ASC',
        collectionId
      );
      return rows.map(
        (row): Story => ({
          collectionId: String(row.collection_id),
          storyNumber: Number(row.story_number),
          title: String(row.title),
          rawContentMd: row.raw_content_md ? String(row.raw_content_md) : null,
          isFavorite: Boolean(row.is_favorite),
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        })
      );
    } catch (error) {
      warn(
        `Error getting stories for collection ${collectionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  async getStory(collectionId: string, storyNumber: number): Promise<Story | null> {
    if (!this.initialized) await this.initialize();
    try {
      const row = await this.db.getFirstAsync<any>(
        'SELECT * FROM stories WHERE collection_id = ? AND story_number = ?',
        collectionId,
        storyNumber
      );
      if (!row) return null;
      return {
        collectionId: String(row.collection_id),
        storyNumber: Number(row.story_number),
        title: String(row.title),
        rawContentMd: row.raw_content_md ? String(row.raw_content_md) : null,
        isFavorite: Boolean(row.is_favorite),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      };
    } catch (error) {
      warn(
        `Error getting story ${storyNumber} for collection ${collectionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  async getStoryFrames(collectionId: string, storyNumber: number): Promise<Frame[]> {
    if (!this.initialized) await this.initialize();
    try {
      const rows = await this.db.getAllAsync<any>(
        'SELECT * FROM frames WHERE collection_id = ? AND story_number = ? ORDER BY frame_number ASC',
        collectionId,
        storyNumber
      );
      return rows.map(
        (row): Frame => ({
          collectionId: String(row.collection_id),
          storyNumber: Number(row.story_number),
          frameNumber: Number(row.frame_number),
          imageUrl: String(row.image_url),
          text: String(row.text),
          isFavorite: Boolean(row.is_favorite),
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        })
      );
    } catch (error) {
      warn(
        `Error getting frames for story ${storyNumber} in collection ${collectionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  async getFrame(
    collectionId: string,
    storyNumber: number,
    frameNumber: number
  ): Promise<Frame | null> {
    if (!this.initialized) await this.initialize();
    try {
      const row = await this.db.getFirstAsync<any>(
        'SELECT * FROM frames WHERE collection_id = ? AND story_number = ? AND frame_number = ?',
        collectionId,
        storyNumber,
        frameNumber
      );
      if (!row) return null;
      return {
        collectionId: String(row.collection_id),
        storyNumber: Number(row.story_number),
        frameNumber: Number(row.frame_number),
        imageUrl: String(row.image_url),
        text: String(row.text),
        isFavorite: Boolean(row.is_favorite),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      };
    } catch (error) {
      warn(
        `Error getting frame ${frameNumber} for story ${storyNumber}, collection ${collectionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  // Favorites Management V2
  async toggleStoryFavorite(collectionId: string, storyNumber: number): Promise<void> {
    if (!this.initialized) await this.initialize();
    try {
      await this.db.runAsync(
        'UPDATE stories SET is_favorite = CASE WHEN is_favorite = 0 THEN 1 ELSE 0 END WHERE collection_id = ? AND story_number = ?',
        collectionId,
        storyNumber
      );
    } catch (error) {
      warn(
        `Error toggling favorite for story ${storyNumber}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async toggleFrameFavorite(
    collectionId: string,
    storyNumber: number,
    frameNumber: number
  ): Promise<void> {
    if (!this.initialized) await this.initialize();
    try {
      await this.db.runAsync(
        'UPDATE frames SET is_favorite = CASE WHEN is_favorite = 0 THEN 1 ELSE 0 END WHERE collection_id = ? AND story_number = ? AND frame_number = ?',
        collectionId,
        storyNumber,
        frameNumber
      );
    } catch (error) {
      warn(
        `Error toggling favorite for frame ${frameNumber} (story ${storyNumber}): ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getFavoriteStories(): Promise<Story[]> {
    if (!this.initialized) await this.initialize();
    try {
      const rows = await this.db.getAllAsync<any>(
        'SELECT * FROM stories WHERE is_favorite = 1 ORDER BY collection_id ASC, story_number ASC'
      );
      return rows.map(
        (row): Story => ({
          collectionId: String(row.collection_id),
          storyNumber: Number(row.story_number),
          title: String(row.title),
          rawContentMd: row.raw_content_md ? String(row.raw_content_md) : null,
          isFavorite: true,
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        })
      );
    } catch (error) {
      warn(
        `Error getting favorite stories: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  async getFavoriteFrames(): Promise<Frame[]> {
    if (!this.initialized) await this.initialize();
    try {
      const rows = await this.db.getAllAsync<any>(
        'SELECT * FROM frames WHERE is_favorite = 1 ORDER BY collection_id ASC, story_number ASC, frame_number ASC'
      );
      return rows.map(
        (row): Frame => ({
          collectionId: String(row.collection_id),
          storyNumber: Number(row.story_number),
          frameNumber: Number(row.frame_number),
          imageUrl: String(row.image_url),
          text: String(row.text),
          isFavorite: true,
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        })
      );
    } catch (error) {
      warn(
        `Error getting favorite frames: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  // Thumbnail Management (remains largely the same)
  async getCollectionThumbnail(id: string): Promise<string | null> {
    if (!this.initialized) await this.initialize();
    return this.imagesManager.getCollectionThumbnail(id);
  }

  async saveCollectionThumbnail(id: string, imageData: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.imagesManager.saveCollectionThumbnail(id, imageData);
  }

  async deleteCollectionThumbnail(id: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.imagesManager.deleteCollectionThumbnail(id);
  }

  async deleteCollection(id: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Ensure this.db is the initialized one with foreign_keys = ON
    if (!this.db) {
      // This case should ideally not be hit if initialize() works correctly and is always called.
      // If it is hit, it means we are re-opening the DB, and MUST set foreign_keys = ON.
      warn(
        `Database connection was not ready in deleteCollection for ${id}. Re-opening and configuring.`
      );
      this.db = await SQLite.openDatabaseAsync('collections.db');
      await this.db.execAsync('PRAGMA foreign_keys = ON;'); // Crucial for this connection
    }

    try {
      // Explicitly delete from dependent tables first.
      // This ensures data is removed even if ON DELETE CASCADE isn't active for some reason.
      await this.db.runAsync('DELETE FROM frames WHERE collection_id = ?', id);
      await this.db.runAsync('DELETE FROM stories WHERE collection_id = ?', id);
      await this.db.runAsync('DELETE FROM collection_files WHERE collection_id = ?', id);

      // Then delete from the main collections table
      await this.db.runAsync('DELETE FROM collections WHERE id = ?', id);

      this.collections.delete(id); // Clear from in-memory cache
      await this.imagesManager.deleteCollectionThumbnail(id); // Delete associated thumbnail image
      warn(`Collection ${id} deleted successfully.`);
    } catch (error) {
      warn(
        `Error deleting collection ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
      // Consider re-throwing or handling more robustly if deletion is critical
    }
  }

  // Private helper methods
  private async loadCollections(): Promise<void> {
    try {
      const rows = await this.db.getAllAsync<any>('SELECT * FROM collections'); // any for row type
      this.collections.clear();
      rows.forEach((row) => {
        const collection: Collection = {
          id: String(row.id),
          owner: String(row.owner),
          language: String(row.language),
          displayName: String(row.displayName),
          version: String(row.version),
          imageSetId: String(row.imageSetId),
          lastUpdated: new Date(row.lastUpdated),
          isDownloaded: Boolean(row.isDownloaded),
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        };
        this.collections.set(collection.id, collection);
      });
      warn(`Loaded ${this.collections.size} collections from DB.`);
    } catch (error) {
      warn(
        `Error loading collections from DB: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async saveCollectionToDB(collection: Collection): Promise<void> {
    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO collections (
          id, owner, language, displayName, version, imageSetId,
          lastUpdated, isDownloaded, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        collection.id,
        collection.owner,
        collection.language,
        collection.displayName,
        collection.version,
        collection.imageSetId,
        collection.lastUpdated.toISOString(),
        collection.isDownloaded ? 1 : 0,
        collection.metadata ? JSON.stringify(collection.metadata) : null
      );
      this.collections.set(collection.id, collection); // Update in-memory cache
    } catch (error) {
      warn(
        `Error saving collection ${collection.id} to DB: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async markAsDownloaded(id: string, downloaded: boolean): Promise<void> {
    const collection = this.collections.get(id);
    if (collection) {
      collection.isDownloaded = downloaded;
      collection.lastUpdated = new Date(); // Update lastUpdated timestamp on download status change
      await this.saveCollectionToDB(collection);
    } else {
      warn(`Attempted to mark collection ${id} as downloaded, but it was not found in memory.`);
      const tempCollection = await this.getCollectionById(id);
      if (tempCollection) {
        tempCollection.isDownloaded = downloaded;
        tempCollection.lastUpdated = new Date();
        await this.saveCollectionToDB(tempCollection);
      } else {
        warn(
          `Attempted to mark non-existent collection ${id} as downloaded, after failing to find in memory or DB.`
        );
      }
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

  // V2 ZIP Processing
  private async processAndStoreZip(collection: Collection, zipData: ArrayBuffer): Promise<void> {
    try {
      // Ensure the collection record exists in the DB before processing its contents.
      // This is crucial for foreign key constraints if PRAGMA foreign_keys = ON.
      // The subsequent saveCollectionToDB at the end will update it (e.g., isDownloaded status).
      await this.saveCollectionToDB(collection);

      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(zipData);
      const filesToProcess = Object.entries(loadedZip.files);

      const storyFileRegex = /(?:^|\/)(?:content\/)?(\d+)\.md$/i;
      const frameParseRegex =
        /!\[[^\]]*?\]\(([^)]+?)\)\s*([\s\S]*?)(?=(?:!\[[^\]]*?\]\([^)]+?\))|$)/g;

      for (const [fullPath, zipEntry] of filesToProcess) {
        if (zipEntry.dir) continue;

        /**
         * Content is a markdown string that contains one story and should have the following structure
         * A title on the first line
         * Multiple frames which consist of an image link and text, the frame ends when the next frame starts (a new image link found) or a footer is found, or the end of the file is found.
         * A footer, that indicates the Bible source references used for the story.
         *
         * Example:
         * # 1. La Creación
         *
         * ![OBS Image](https://cdn.door43.org/obs/jpg/360px/obs-en-01-01.jpg)

         * Así es como Dios hizo todas las cosas en el principio. Él creó el universo y todas las cosas que hay ahí en seis días. Después de que Dios creó la tierra, estaba oscura y vacía, porque aún no había formado nada en ella. Pero el Espíritu de Dios estaba ahí sobre el agua.
         *
         * ![OBS Image](https://cdn.door43.org/obs/jpg/360px/obs-en-01-02.jpg)

         * Entonces Dios dijo: "¡Qué haya luz!" Y hubo luz. Dios vio que la luz era buena y la llamó "día". La separó de la oscuridad, a la cual llamó "noche". Dios creó la luz en el primer día de la creación.
         *
         * _Una historia bíblica de: Génesis 1-2_
         */
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

          const story: Story = {
            collectionId: collection.id,
            storyNumber,
            title,
            rawContentMd: content,
            isFavorite: false,
          };
          console.log({ story, storyNumber });
          await this.saveStoryToDB(story);

          let frameNumber = 0;
          let match;
          frameParseRegex.lastIndex = 0;
          while ((match = frameParseRegex.exec(content)) !== null) {
            frameNumber++;
            const imageUrl = match[1].trim();
            const frameText = match[2].trim();
            console.log(frameText);
            if (!imageUrl || !frameText) {
              warn(
                `Skipping empty frame ${frameNumber} in story ${storyNumber} of ${collection.id}`
              );
              continue;
            }

            const frame: Frame = {
              collectionId: collection.id,
              storyNumber,
              frameNumber,
              imageUrl,
              text: frameText,
              isFavorite: false,
            };
            await this.saveFrameToDB(frame);
          }
          warn(
            `Processed story ${storyNumber} with ${frameNumber} frames for collection ${collection.id}.`
          );
        } else {
          const zipRootFolder =
            filesToProcess.find((f) => f[1].dir && f[0].endsWith('/'))?.[0] || '';
          const relativePath = fullPath.startsWith(zipRootFolder)
            ? fullPath.substring(zipRootFolder.length)
            : fullPath;

          if (relativePath) {
            await this.saveFileToDB(collection.id, relativePath, content);
          }
        }
      }

      collection.isDownloaded = true;
      collection.lastUpdated = new Date();
      await this.saveCollectionToDB(collection);

      warn(`Processed and stored files from zip for collection ${collection.id}`);
    } catch (error) {
      warn(
        `Error processing ZIP for collection ${collection.id}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  private async saveFileToDB(
    collectionId: string,
    filename: string,
    content: string
  ): Promise<void> {
    try {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO collection_files (collection_id, filename, content) VALUES (?, ?, ?)',
        collectionId,
        filename,
        content
      );
    } catch (error) {
      warn(
        `Error saving file ${filename} for collection ${collectionId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // V2 Save Story
  private async saveStoryToDB(story: Story): Promise<void> {
    try {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO stories (collection_id, story_number, title, raw_content_md, is_favorite, metadata) VALUES (?, ?, ?, ?, ?, ?)',
        story.collectionId,
        story.storyNumber,
        story.title,
        story.rawContentMd === undefined ? null : story.rawContentMd,
        story.isFavorite ? 1 : 0,
        story.metadata ? JSON.stringify(story.metadata) : null
      );
    } catch (error) {
      warn(
        `Error saving story ${story.storyNumber} for collection ${story.collectionId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // V2 Save Frame
  private async saveFrameToDB(frame: Frame): Promise<void> {
    try {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO frames (collection_id, story_number, frame_number, image_url, text, is_favorite, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
        frame.collectionId,
        frame.storyNumber,
        frame.frameNumber,
        frame.imageUrl,
        frame.text,
        frame.isFavorite ? 1 : 0,
        frame.metadata ? JSON.stringify(frame.metadata) : null
      );
    } catch (error) {
      warn(
        `Error saving frame ${frame.frameNumber} for story ${frame.storyNumber}, collection ${frame.collectionId}: ${error instanceof Error ? error.message : String(error)}`
      );
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
      const reader = new FileReader(); // FileReader is a Web API, ensure environment supports it or use platform-specific alternative

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
}
