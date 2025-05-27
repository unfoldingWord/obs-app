import * as SQLite from 'expo-sqlite';
import { warn } from './utils';

export interface FrameComment {
  id: string;
  collectionId: string;
  storyNumber: number;
  frameNumber: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CommentsManager {
  private static instance: CommentsManager;
  private db!: SQLite.SQLiteDatabase;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): CommentsManager {
    if (!CommentsManager.instance) {
      CommentsManager.instance = new CommentsManager();
    }
    return CommentsManager.instance;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      this.db = await SQLite.openDatabaseAsync('comments.db');
      await this.createTables();
      this.initialized = true;
    }
  }

  private async createTables(): Promise<void> {
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS frame_comments (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        story_number INTEGER NOT NULL,
        frame_number INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_frame_comments_frame
      ON frame_comments(collection_id, story_number, frame_number);
    `);
  }

  async addComment(
    collectionId: string,
    storyNumber: number,
    frameNumber: number,
    comment: string
  ): Promise<string> {
    if (!this.initialized) await this.initialize();

    const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    try {
      await this.db.runAsync(
        `INSERT INTO frame_comments
         (id, collection_id, story_number, frame_number, comment, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, collectionId, storyNumber, frameNumber, comment, now, now]
      );

      return id;
    } catch (error) {
      warn(
        `Error adding comment: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async getFrameComments(
    collectionId: string,
    storyNumber: number,
    frameNumber: number
  ): Promise<FrameComment[]> {
    if (!this.initialized) await this.initialize();

    try {
      const results = await this.db.getAllAsync<any>(
        `SELECT * FROM frame_comments
         WHERE collection_id = ? AND story_number = ? AND frame_number = ?
         ORDER BY created_at DESC`,
        [collectionId, storyNumber, frameNumber]
      );

      return results.map((row: any) => ({
        id: row.id,
        collectionId: row.collection_id,
        storyNumber: row.story_number,
        frameNumber: row.frame_number,
        comment: row.comment,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      warn(
        `Error getting frame comments: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  async updateComment(commentId: string, newComment: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    const now = new Date().toISOString();

    try {
      await this.db.runAsync(
        'UPDATE frame_comments SET comment = ?, updated_at = ? WHERE id = ?',
        [newComment, now, commentId]
      );
    } catch (error) {
      warn(
        `Error updating comment: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.db.runAsync('DELETE FROM frame_comments WHERE id = ?', [commentId]);
    } catch (error) {
      warn(
        `Error deleting comment: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async getAllComments(): Promise<FrameComment[]> {
    if (!this.initialized) await this.initialize();

    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM frame_comments ORDER BY created_at DESC'
      );

      return results.map((row: any) => ({
        id: row.id,
        collectionId: row.collection_id,
        storyNumber: row.story_number,
        frameNumber: row.frame_number,
        comment: row.comment,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      warn(
        `Error getting all comments: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  async getCommentsCount(
    collectionId: string,
    storyNumber: number,
    frameNumber: number
  ): Promise<number> {
    if (!this.initialized) await this.initialize();

    try {
      const result = await this.db.getFirstAsync<any>(
        `SELECT COUNT(*) as count FROM frame_comments
         WHERE collection_id = ? AND story_number = ? AND frame_number = ?`,
        [collectionId, storyNumber, frameNumber]
      );

      return result?.count || 0;
    } catch (error) {
      warn(
        `Error getting comments count: ${error instanceof Error ? error.message : String(error)}`
      );
      return 0;
    }
  }

  async deleteCommentsForCollection(collectionId: string): Promise<number> {
    if (!this.initialized) await this.initialize();

    try {
      const result = await this.db.runAsync(
        'DELETE FROM frame_comments WHERE collection_id = ?',
        [collectionId]
      );

      return result.changes || 0;
    } catch (error) {
      warn(
        `Error deleting comments for collection: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
