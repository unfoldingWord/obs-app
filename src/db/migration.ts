import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../core/DatabaseManager';
import { warn } from '../core/utils';

export class DataMigration {
  private databaseManager: DatabaseManager;

  constructor() {
    this.databaseManager = DatabaseManager.getInstance();
  }

  async migrateFromLegacyDatabases(): Promise<void> {
    try {
      await this.databaseManager.initialize();

      // Check if migration has already been completed
      if (await this.isMigrationCompleted()) {
        warn('ℹ️ Migration has already been completed, skipping...');
        return;
      }

      warn('🔄 Starting migration from legacy databases...');

      // Migrate languages first (required for foreign key constraints)
      await this.migrateLanguages();

      // Migrate collections (this will also create owner entries)
      await this.migrateCollections();

      // Mark migration as completed
      await this.markMigrationCompleted();

      warn('✅ Migration completed successfully!');
    } catch (error) {
      warn(`❌ Migration failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async isMigrationCompleted(): Promise<boolean> {
    try {
      // Check if migration marker exists in AsyncStorage
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const migrationCompleted = await AsyncStorage.getItem('@migration_completed');
      
      if (migrationCompleted === 'true') {
        return true;
      }

      // Also check if we have data in the new database as a backup check
      const collections = await this.databaseManager.getAllCollections();
      const hasData = collections.length > 0;
      
      if (hasData) {
        // Mark as completed if we find data but no marker
        await AsyncStorage.setItem('@migration_completed', 'true');
        return true;
      }

      return false;
    } catch (error) {
      warn(`Error checking migration status: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private async markMigrationCompleted(): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('@migration_completed', 'true');
      
      // Also add a marker in the database
      await this.databaseManager.saveLanguage({
        lc: '__migration_marker__',
        ln: 'Migration Completed',
        ang: 'Migration Completed'
      });
      
      warn('📝 Migration marked as completed');
    } catch (error) {
      warn(`Error marking migration as completed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async migrateLanguages(): Promise<void> {
    const legacyDb = await this.openLegacyDatabase('languages.db');
    if (!legacyDb) {
      warn('⚠️ Legacy languages database not found, skipping language migration');
      return;
    }

    try {
      warn('🔄 Migrating languages...');
      
      const legacyLanguages = await this.getLegacyLanguages(legacyDb);
      warn(`Found ${legacyLanguages.length} languages to migrate`);

      let migratedCount = 0;
      for (const lang of legacyLanguages) {
        try {
          await this.databaseManager.saveLanguage({
            lc: this.getFieldValue(lang, 'lc', 'languageCode') || lang.lc,
            ln: this.getFieldValue(lang, 'ln', 'nativeName') || lang.ln || lang.lc,
            ang: this.getFieldValue(lang, 'ang', 'englishName') || lang.ang || lang.lc,
            ld: this.getFieldValue(lang, 'ld', 'direction') || lang.ld || 'ltr',
            gw: Boolean(this.getFieldValue(lang, 'gw', 'isGateway') || lang.gw || false),
            hc: this.getFieldValue(lang, 'hc', 'countryCode') || lang.hc || '',
            lr: this.getFieldValue(lang, 'lr', 'region') || lang.lr || '',
            pk: parseInt(this.getFieldValue(lang, 'pk', 'catalogId') || lang.pk || '0', 10),
            alt: this.parseJsonField(lang.alt) || [],
            cc: this.parseJsonField(lang.cc) || []
          });
          migratedCount++;
        } catch (error) {
          warn(`Error migrating language ${lang.lc}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      warn(`✅ Successfully migrated ${migratedCount} languages`);
    } catch (error) {
      warn(`Error during language migration: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      try {
        await legacyDb.closeAsync();
      } catch (error) {
        warn(`Error closing legacy languages database: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async migrateCollections(): Promise<void> {
    const legacyDb = await this.openLegacyDatabase('collections.db');
    if (!legacyDb) {
      warn('⚠️ Legacy collections database not found, skipping collection migration');
      return;
    }

    try {
      warn('🔄 Migrating collections...');
      
      const legacyCollections = await this.getLegacyCollections(legacyDb);
      warn(`Found ${legacyCollections.length} collections to migrate`);

      let migratedCount = 0;
      const ownerCache = new Set<string>(); // Track owners we've already processed

      for (const collection of legacyCollections) {
        try {
          if (!collection.id) {
            warn('⚠️ Skipping collection with missing ID');
            continue;
          }

          // Validate collection_id is not null
          if (!collection.id || collection.id.trim() === '') {
            warn('⚠️ Skipping collection with invalid collection ID');
            continue;
          }

          // Extract owner from collection ID (format: owner/repo)
          const [owner] = collection.id.split('/');
          if (!owner) {
            warn(`⚠️ Could not extract owner from collection ID: ${collection.id}`);
            continue;
          }

          // Create owner entry if we haven't seen this owner before
          if (!ownerCache.has(owner)) {
            await this.ensureOwnerExists(owner);
            ownerCache.add(owner);
          }

          // Migrate collection data
          await this.databaseManager.saveCollection({
            id: collection.id,
            owner: owner,
            language: this.getFieldValue(collection, 'language', 'languageCode') || collection.language,
            displayName: this.getFieldValue(collection, 'displayName', 'name', 'title') || collection.displayName || collection.id,
            version: this.getFieldValue(collection, 'version') || collection.version || '1.0.0',
            imageSetId: this.getFieldValue(collection, 'imageSetId', 'imageSet') || collection.imageSetId || 'default',
            lastUpdated: this.parseDate(this.getFieldValue(collection, 'lastUpdated', 'updated_at') || collection.lastUpdated),
            isDownloaded: Boolean(this.getFieldValue(collection, 'isDownloaded', 'downloaded') || collection.isDownloaded || false),
            metadata: this.parseJsonField(collection.metadata) || {}
          });

          // Migrate stories and frames for this collection
          await this.migrateStoriesAndFrames(collection.id);

          migratedCount++;
        } catch (error) {
          warn(`Error migrating collection ${collection.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      warn(`✅ Successfully migrated ${migratedCount} collections`);
    } catch (error) {
      warn(`Error during collection migration: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      try {
        await legacyDb.closeAsync();
      } catch (error) {
        warn(`Error closing legacy collections database: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async ensureOwnerExists(ownerUsername: string): Promise<void> {
    try {
      // Check if owner already exists
      const existingOwner = await this.databaseManager.getRepositoryOwner(ownerUsername);
      if (existingOwner) {
        return; // Owner already exists
      }

      // Create minimal owner entry
      await this.databaseManager.saveRepositoryOwner({
        username: ownerUsername,
        fullName: ownerUsername, // Use username as fallback
        ownerType: 'user' // Default to user type
      });

      warn(`Created owner entry for: ${ownerUsername}`);
    } catch (error) {
      warn(`Error creating owner entry for ${ownerUsername}: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw - owner creation failure shouldn't stop migration
    }
  }

  private async migrateStoriesAndFrames(collectionId: string): Promise<void> {
    // Try to get stories from the collections database first
    const collectionsDb = await this.openLegacyDatabase('collections.db');
    if (collectionsDb) {
      try {
        const stories = await this.getLegacyStoriesFromCollections(collectionsDb, collectionId);
        for (const story of stories) {
          await this.databaseManager.saveStory({
            collection_id: collectionId,
            story_number: story.storyNumber || story.story_number,
            title: story.title || `Story ${story.storyNumber || story.story_number}`,
            is_favorite: Boolean(story.isFavorite || story.is_favorite || false),
            metadata: this.parseJsonField(story.metadata) || {}
          });

          // Get frames for this story
          const frames = await this.getLegacyFramesFromCollections(collectionsDb, collectionId, story.storyNumber || story.story_number);
          for (const frame of frames) {
            await this.databaseManager.saveFrame({
              collection_id: collectionId,
              story_number: story.storyNumber || story.story_number,
              frame_number: frame.frameNumber || frame.frame_number,
              image_url: frame.imageUrl || frame.image_url || '',
              text: frame.text || '',
              is_favorite: Boolean(frame.isFavorite || frame.is_favorite || false),
              metadata: this.parseJsonField(frame.metadata) || {}
            });
          }
        }
      } catch (error) {
        warn(`Error migrating stories/frames for ${collectionId}: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        await collectionsDb.closeAsync();
      }
    }
  }

  // Database helper methods
  private async openLegacyDatabase(dbName: string): Promise<SQLite.SQLiteDatabase | null> {
    try {
      const db = SQLite.openDatabaseSync(dbName);
      // Test if database exists by trying a simple query
      await db.getFirstAsync('SELECT name FROM sqlite_master WHERE type="table" LIMIT 1');
      return db;
    } catch (error) {
      warn(`Database ${dbName} not found or empty: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private async getLegacyLanguages(db: SQLite.SQLiteDatabase): Promise<any[]> {
    try {
      const result = await db.getAllAsync('SELECT * FROM languages');
      return result || [];
    } catch (error) {
      warn(`Error reading languages: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async getLegacyCollections(db: SQLite.SQLiteDatabase): Promise<any[]> {
    try {
      const result = await db.getAllAsync('SELECT * FROM collections');
      return result || [];
    } catch (error) {
      warn(`Error reading collections: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async getLegacyStoriesFromCollections(db: SQLite.SQLiteDatabase, collectionId: string): Promise<any[]> {
    try {
      const result = await db.getAllAsync('SELECT * FROM stories WHERE collection_id = ? OR collectionId = ?', [collectionId, collectionId]);
      return result || [];
    } catch (error) {
      warn(`Error reading stories for ${collectionId}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async getLegacyFramesFromCollections(db: SQLite.SQLiteDatabase, collectionId: string, storyNumber: number): Promise<any[]> {
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM frames WHERE (collection_id = ? OR collectionId = ?) AND (story_number = ? OR storyNumber = ?)',
        [collectionId, collectionId, storyNumber, storyNumber]
      );
      return result || [];
    } catch (error) {
      warn(`Error reading frames for ${collectionId}/${storyNumber}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // Utility methods
  private getFieldValue(obj: any, ...fieldNames: string[]): any {
    for (const fieldName of fieldNames) {
      if (obj.hasOwnProperty(fieldName) && obj[fieldName] != null) {
        return obj[fieldName];
      }
    }
    return null;
  }

  private parseJsonField(value: any): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }

  private parseDate(value: any): string {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    }
    return new Date().toISOString();
  }

  // Cleanup methods
  async cleanupLegacyDatabases(): Promise<void> {
    warn('🧹 Starting cleanup of legacy databases...');
    
    const databasesToCleanup = ['languages.db', 'collections.db', 'comments.db'];
    let cleanedCount = 0;

    for (const dbName of databasesToCleanup) {
      try {
        const db = await this.openLegacyDatabase(dbName);
        if (db) {
          await db.closeAsync();
          // Note: We don't actually delete the files in case user wants to keep them
          // Just close the connections
          warn(`📁 Legacy database ${dbName} cleanup completed`);
          cleanedCount++;
        }
      } catch (error) {
        warn(`Error cleaning up ${dbName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    warn(`✅ Cleaned up ${cleanedCount} legacy databases`);
  }
}

export default DataMigration;
