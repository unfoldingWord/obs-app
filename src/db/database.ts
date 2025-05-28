import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';

const db = SQLite.openDatabaseSync('app.db');

export const database = drizzle(db, { schema });

export const initializeDatabase = async () => {
  try {
    // Enable foreign keys and WAL mode
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Create tables manually since Drizzle doesn't auto-create from schema
    await db.execAsync(`
      -- Languages Table
      CREATE TABLE IF NOT EXISTS languages (
        lc TEXT PRIMARY KEY,
        ln TEXT NOT NULL,
        ang TEXT NOT NULL,
        ld TEXT NOT NULL DEFAULT 'ltr',
        gw INTEGER NOT NULL DEFAULT 0,
        hc TEXT NOT NULL DEFAULT '',
        lr TEXT NOT NULL DEFAULT '',
        pk INTEGER NOT NULL DEFAULT 0,
        alt TEXT NOT NULL DEFAULT '[]',
        cc TEXT NOT NULL DEFAULT '[]',
        last_updated TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Collections Table
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        owner TEXT NOT NULL,
        language TEXT NOT NULL REFERENCES languages(lc) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        version TEXT NOT NULL,
        image_set_id TEXT NOT NULL,
        last_updated TEXT NOT NULL DEFAULT (datetime('now')),
        is_downloaded INTEGER NOT NULL DEFAULT 0,
        metadata TEXT
      );

      -- Stories Table
      CREATE TABLE IF NOT EXISTS stories (
        collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        story_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        metadata TEXT,
        PRIMARY KEY (collection_id, story_number)
      );

      -- Frames Table
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

      -- Frame Comments Table
      CREATE TABLE IF NOT EXISTS frame_comments (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        story_number INTEGER NOT NULL,
        frame_number INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Create Indexes
      CREATE INDEX IF NOT EXISTS idx_languages_gw ON languages(gw);
      CREATE INDEX IF NOT EXISTS idx_languages_lr ON languages(lr);
      CREATE INDEX IF NOT EXISTS idx_collections_language ON collections(language);
      CREATE INDEX IF NOT EXISTS idx_collections_downloaded ON collections(is_downloaded);
      CREATE INDEX IF NOT EXISTS idx_stories_favorite ON stories(is_favorite);
      CREATE INDEX IF NOT EXISTS idx_frames_favorite ON frames(is_favorite);
      CREATE INDEX IF NOT EXISTS idx_frames_story ON frames(collection_id, story_number);
      CREATE INDEX IF NOT EXISTS idx_frame_comments_frame ON frame_comments(collection_id, story_number, frame_number);
      CREATE INDEX IF NOT EXISTS idx_frame_comments_created ON frame_comments(created_at);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export default database;
