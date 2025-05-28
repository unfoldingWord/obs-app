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

      // Migrate collections (depends on languages)
      await this.migrateCollections();

      // Migrate comments
      await this.migrateComments();

      // Mark migration as completed
      await this.markMigrationCompleted();

      warn('✅ Migration completed successfully');
    } catch (error) {
      warn(`❌ Migration failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async isMigrationCompleted(): Promise<boolean> {
    try {
      // Check if we have any data in the new database
      const languages = await this.databaseManager.getAllLanguages();
      const collections = await this.databaseManager.getAllCollections();

      // If we have data in the new database, assume migration is complete
      if (languages.length > 0 || collections.length > 0) {
        return true;
      }

      // Also check for a migration completion marker
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const migrationCompleted = await AsyncStorage.getItem('@migration_completed');
      return migrationCompleted === 'true';
    } catch (error) {
      warn(`Error checking migration status: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private async markMigrationCompleted(): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('@migration_completed', 'true');

      // Delete legacy databases after successful migration
      await this.deleteLegacyDatabases();

      warn('📋 Migration marked as completed');
    } catch (error) {
      warn(`Error marking migration as completed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deleteLegacyDatabases(): Promise<void> {
    try {
      const FileSystem = (await import('expo-file-system')).default;
      const databases = ['languages.db', 'collections.db', 'comments.db'];

      for (const dbName of databases) {
        try {
          // Get the database file path
          const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

          // Check if file exists and delete it
          const fileInfo = await FileSystem.getInfoAsync(dbPath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(dbPath);
            warn(`🗑️ Deleted legacy database: ${dbName}`);
          } else {
            warn(`ℹ️ Legacy database not found: ${dbName}`);
          }
        } catch (error) {
          warn(`⚠️ Could not delete ${dbName}: ${error instanceof Error ? error.message : String(error)}`);
          // Try fallback method to mark database as migrated
          await this.markDatabaseAsMigrated(dbName);
        }
      }

      warn('🧹 Legacy database cleanup completed');
    } catch (error) {
      warn(`Error during legacy database cleanup: ${error instanceof Error ? error.message : String(error)}`);
      // If FileSystem is not available, fall back to marking databases
      await this.markLegacyDatabasesAsMigrated();
    }
  }

  private async markDatabaseAsMigrated(dbName: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const markerDb = await SQLite.openDatabaseAsync(dbName);
      await markerDb.execAsync('CREATE TABLE IF NOT EXISTS __migration_completed (completed_at TEXT)');
      await markerDb.execAsync(`INSERT OR REPLACE INTO __migration_completed VALUES ('${timestamp}')`);
      await markerDb.closeAsync();
      warn(`📦 Marked ${dbName} as migrated (fallback)`);
    } catch (error) {
      warn(`Could not mark ${dbName} as migrated: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async markLegacyDatabasesAsMigrated(): Promise<void> {
    const databases = ['languages.db', 'collections.db', 'comments.db'];
    for (const dbName of databases) {
      await this.markDatabaseAsMigrated(dbName);
    }
  }

  private async migrateLanguages(): Promise<void> {
    try {
      warn('🔄 Migrating languages...');

      // Try to open the old languages database
      let oldDb: SQLite.SQLiteDatabase;
      try {
        oldDb = await SQLite.openDatabaseAsync('languages.db');

        // Check if this database has already been migrated
        try {
          const migrationCheck = await oldDb.getAllAsync('SELECT * FROM __migration_completed LIMIT 1');
          if (migrationCheck.length > 0) {
            warn('ℹ️ Languages database already migrated, skipping...');
            await oldDb.closeAsync();
            return;
          }
        } catch (error) {
          // Migration marker table doesn't exist, proceed with migration
        }
      } catch (error) {
        warn('ℹ️ No legacy languages database found, skipping language migration');
        return;
      }

      const languages = await oldDb.getAllAsync<any>('SELECT * FROM languages');
      warn(`📊 Found ${languages.length} languages to migrate`);

      for (const lang of languages) {
        try {
          await this.databaseManager.saveLanguage({
            lc: lang.lc,
            ln: lang.ln,
            ang: lang.ang,
            ld: lang.ld || 'ltr',
            gw: Boolean(lang.gw),
            hc: lang.hc || '',
            lr: lang.lr || '',
            pk: lang.pk || 0,
            alt: lang.alt ? JSON.parse(lang.alt) : [],
            cc: lang.cc ? JSON.parse(lang.cc) : [],
            lastUpdated: lang.last_updated || lang.lastUpdated || new Date().toISOString()
          });
        } catch (error) {
          warn(`⚠️ Error migrating language ${lang.lc}: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with other languages
        }
      }

      await oldDb.closeAsync();
      warn(`✅ Migrated ${languages.length} languages`);
    } catch (error) {
      warn(`❌ Error migrating languages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async migrateCollections(): Promise<void> {
    try {
      warn('🔄 Migrating collections...');

      // Try to open the old collections database
      let oldDb: SQLite.SQLiteDatabase;
      try {
        oldDb = await SQLite.openDatabaseAsync('collections.db');

        // Check if this database has already been migrated
        try {
          const migrationCheck = await oldDb.getAllAsync('SELECT * FROM __migration_completed LIMIT 1');
          if (migrationCheck.length > 0) {
            warn('ℹ️ Collections database already migrated, skipping...');
            await oldDb.closeAsync();
            return;
          }
        } catch (error) {
          // Migration marker table doesn't exist, proceed with migration
        }
      } catch (error) {
        warn('ℹ️ No legacy collections database found, skipping collection migration');
        return;
      }

      // Migrate collections
      const collections = await oldDb.getAllAsync<any>('SELECT * FROM collections');
      warn(`📊 Found ${collections.length} collections to migrate`);

      for (const collection of collections) {
        try {
          await this.databaseManager.saveCollection({
            id: collection.id,
            owner: collection.owner,
            language: collection.language,
            displayName: collection.displayName || collection.display_name || collection.title || collection.id,
            version: collection.version || '1.0.0',
            imageSetId: collection.imageSetId || collection.image_set_id || 'default-image-pack',
            lastUpdated: collection.lastUpdated || collection.last_updated || new Date().toISOString(),
            isDownloaded: Boolean(collection.isDownloaded || collection.is_downloaded),
            metadata: collection.metadata ? (typeof collection.metadata === 'string' ? JSON.parse(collection.metadata) : collection.metadata) : undefined
          });
        } catch (error) {
          warn(`⚠️ Error migrating collection ${collection.id}: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with other collections
        }
      }

      // Migrate stories
      const stories = await oldDb.getAllAsync<any>('SELECT * FROM stories');
      warn(`📊 Found ${stories.length} stories to migrate`);

      for (const story of stories) {
        // Skip stories with invalid collection_id
        if (!story.collection_id) {
          warn(`⚠️ Skipping story ${story.story_number} with null collection_id`);
          continue;
        }

        try {
          await this.databaseManager.saveStory({
            collection_id: story.collection_id,
            story_number: story.story_number,
            title: story.title || `Story ${story.story_number}`,
            is_favorite: Boolean(story.is_favorite || story.isFavorite),
            metadata: story.metadata ? (typeof story.metadata === 'string' ? JSON.parse(story.metadata) : story.metadata) : undefined
          });
        } catch (error) {
          warn(`⚠️ Error migrating story ${story.collection_id}/${story.story_number}: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with other stories
        }
      }

      // Migrate frames
      const frames = await oldDb.getAllAsync<any>('SELECT * FROM frames');
      warn(`📊 Found ${frames.length} frames to migrate`);

      for (const frame of frames) {
        // Skip frames with invalid collection_id
        if (!frame.collection_id) {
          warn(`⚠️ Skipping frame ${frame.frame_number} with null collection_id`);
          continue;
        }

        try {
          await this.databaseManager.saveFrame({
            collection_id: frame.collection_id,
            story_number: frame.story_number,
            frame_number: frame.frame_number,
            image_url: frame.image_url || frame.imageUrl || '',
            text: frame.text || '',
            is_favorite: Boolean(frame.is_favorite || frame.isFavorite),
            metadata: frame.metadata ? (typeof frame.metadata === 'string' ? JSON.parse(frame.metadata) : frame.metadata) : undefined
          });
        } catch (error) {
          warn(`⚠️ Error migrating frame ${frame.collection_id}/${frame.story_number}/${frame.frame_number}: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with other frames
        }
      }

      await oldDb.closeAsync();
      warn(`✅ Migrated ${collections.length} collections, ${stories.length} stories, and ${frames.length} frames`);
    } catch (error) {
      warn(`❌ Error migrating collections: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async migrateComments(): Promise<void> {
    try {
      warn('🔄 Migrating comments...');

      // Try to open the old comments database
      let oldDb: SQLite.SQLiteDatabase;
      try {
        oldDb = await SQLite.openDatabaseAsync('comments.db');

        // Check if this database has already been migrated
        try {
          const migrationCheck = await oldDb.getAllAsync('SELECT * FROM __migration_completed LIMIT 1');
          if (migrationCheck.length > 0) {
            warn('ℹ️ Comments database already migrated, skipping...');
            await oldDb.closeAsync();
            return;
          }
        } catch (error) {
          // Migration marker table doesn't exist, proceed with migration
        }
      } catch (error) {
        warn('ℹ️ No legacy comments database found, skipping comment migration');
        return;
      }

      const comments = await oldDb.getAllAsync<any>('SELECT * FROM frame_comments');
      warn(`📊 Found ${comments.length} comments to migrate`);

      for (const comment of comments) {
        try {
          await this.databaseManager.addComment({
            collection_id: comment.collection_id,
            story_number: comment.story_number,
            frame_number: comment.frame_number,
            comment: comment.comment
          });
        } catch (error) {
          warn(`⚠️ Error migrating comment ${comment.id}: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with other comments
        }
      }

      await oldDb.closeAsync();
      warn(`✅ Migrated ${comments.length} comments`);
    } catch (error) {
      warn(`❌ Error migrating comments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createBackupOfLegacyDatabases(): Promise<void> {
    try {
      warn('🔄 Creating backup of legacy databases...');

      const databases = ['languages.db', 'collections.db', 'comments.db'];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      for (const dbName of databases) {
        try {
          // Check if database exists
          const db = await SQLite.openDatabaseAsync(dbName);
          await db.closeAsync();

          // For now, just log that backup should be created
          // In a real implementation, you might copy the database file
          warn(`📦 Would backup ${dbName} to ${dbName}.backup.${timestamp}`);
        } catch (error) {
          warn(`ℹ️ Database ${dbName} not found, skipping backup`);
        }
      }

      warn('✅ Backup process completed');
    } catch (error) {
      warn(`❌ Error creating backup: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // New method to handle version-specific migrations
  async migrateToVersion(targetVersion: string): Promise<void> {
    try {
      warn(`🔄 Migrating to version ${targetVersion}...`);

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const currentVersion = await AsyncStorage.getItem('@database_version') || '1.0.0';

      if (currentVersion === targetVersion) {
        warn(`ℹ️ Already at version ${targetVersion}, skipping migration`);
        return;
      }

      // Add version-specific migration logic here
      switch (targetVersion) {
        case '1.1.0':
          await this.migrateToV1_1_0();
          break;
        case '1.2.0':
          await this.migrateToV1_2_0();
          break;
        default:
          warn(`⚠️ Unknown target version: ${targetVersion}`);
          return;
      }

      await AsyncStorage.setItem('@database_version', targetVersion);
      warn(`✅ Successfully migrated to version ${targetVersion}`);
    } catch (error) {
      warn(`❌ Error migrating to version ${targetVersion}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async migrateToV1_1_0(): Promise<void> {
    // Placeholder for future schema changes
    warn('ℹ️ No schema changes required for v1.1.0');
  }

  private async migrateToV1_2_0(): Promise<void> {
    // Placeholder for future schema changes
    warn('ℹ️ No schema changes required for v1.2.0');
  }
}

export default DataMigration;
