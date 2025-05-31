import { DatabaseManager } from './DatabaseManager';
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
  private databaseManager: DatabaseManager;
  private initialized: boolean = false;

  private constructor() {
    this.databaseManager = DatabaseManager.getInstance();
  }

  static getInstance(): CommentsManager {
    if (!CommentsManager.instance) {
      CommentsManager.instance = new CommentsManager();
    }
    return CommentsManager.instance;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.databaseManager.initialize();
      this.initialized = true;
    }
  }

  // Conversion helpers
  private convertDbToComment(dbComment: any): FrameComment {
    return {
      id: dbComment.id,
      collectionId: dbComment.collection_id,
      storyNumber: dbComment.story_number,
      frameNumber: dbComment.frame_number,
      comment: dbComment.comment,
      createdAt: new Date(dbComment.created_at),
      updatedAt: new Date(dbComment.updated_at),
    };
  }

  private convertCommentToDb(
    comment: Partial<FrameComment> & {
      collectionId: string;
      storyNumber: number;
      frameNumber: number;
      comment: string;
    }
  ) {
    return {
      collection_id: comment.collectionId,
      story_number: comment.storyNumber,
      frame_number: comment.frameNumber,
      comment: comment.comment,
      created_at: comment.createdAt?.toISOString(),
      updated_at: comment.updatedAt?.toISOString(),
    };
  }

  async addComment(
    collectionId: string,
    storyNumber: number,
    frameNumber: number,
    comment: string
  ): Promise<string> {
    if (!this.initialized) await this.initialize();

    try {
      const id = await this.databaseManager.addComment({
        collection_id: collectionId,
        story_number: storyNumber,
        frame_number: frameNumber,
        comment,
      });

      return id;
    } catch (error) {
      warn(`Error adding comment: ${error instanceof Error ? error.message : String(error)}`);
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
      const dbComments = await this.databaseManager.getFrameComments(
        collectionId,
        storyNumber,
        frameNumber
      );
      return dbComments.map((comment) => this.convertDbToComment(comment));
    } catch (error) {
      warn(
        `Error getting frame comments: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  async updateComment(commentId: string, newComment: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.databaseManager.updateComment(commentId, newComment);
    } catch (error) {
      warn(`Error updating comment: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.databaseManager.deleteComment(commentId);
    } catch (error) {
      warn(`Error deleting comment: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getAllComments(): Promise<FrameComment[]> {
    if (!this.initialized) await this.initialize();

    try {
      const dbComments = await this.databaseManager.getAllComments();
      return dbComments.map((comment) => this.convertDbToComment(comment));
    } catch (error) {
      warn(`Error getting all comments: ${error instanceof Error ? error.message : String(error)}`);
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
      return await this.databaseManager.getCommentsCount(collectionId, storyNumber, frameNumber);
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
      return await this.databaseManager.deleteCommentsForCollection(collectionId);
    } catch (error) {
      warn(
        `Error deleting comments for collection: ${error instanceof Error ? error.message : String(error)}`
      );
      return 0;
    }
  }

  // Additional helper methods for backwards compatibility
  async getComment(commentId: string): Promise<FrameComment | null> {
    if (!this.initialized) await this.initialize();

    try {
      const allComments = await this.getAllComments();
      return allComments.find((comment) => comment.id === commentId) || null;
    } catch (error) {
      warn(
        `Error getting comment by ID: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  async hasComments(
    collectionId: string,
    storyNumber: number,
    frameNumber: number
  ): Promise<boolean> {
    if (!this.initialized) await this.initialize();

    try {
      const count = await this.getCommentsCount(collectionId, storyNumber, frameNumber);
      return count > 0;
    } catch (error) {
      warn(
        `Error checking if frame has comments: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  // Statistics and utilities
  async getCommentStatistics(): Promise<{
    totalComments: number;
    uniqueFrames: number;
    uniqueStories: number;
    uniqueCollections: number;
  }> {
    if (!this.initialized) await this.initialize();

    try {
      const allComments = await this.getAllComments();
      const uniqueFrames = new Set(
        allComments.map((c) => `${c.collectionId}_${c.storyNumber}_${c.frameNumber}`)
      );
      const uniqueStories = new Set(allComments.map((c) => `${c.collectionId}_${c.storyNumber}`));
      const uniqueCollections = new Set(allComments.map((c) => c.collectionId));

      return {
        totalComments: allComments.length,
        uniqueFrames: uniqueFrames.size,
        uniqueStories: uniqueStories.size,
        uniqueCollections: uniqueCollections.size,
      };
    } catch (error) {
      warn(
        `Error getting comment statistics: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        totalComments: 0,
        uniqueFrames: 0,
        uniqueStories: 0,
        uniqueCollections: 0,
      };
    }
  }
}
