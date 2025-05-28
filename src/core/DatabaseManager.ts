import { eq, and, desc, asc, like, count, or } from 'drizzle-orm';
import database, { initializeDatabase } from '../db/database';
import {
  languages,
  collections,
  stories,
  frames,
  frameComments,
  type Language,
  type NewLanguage,
  type Collection,
  type NewCollection,
  type Story,
  type NewStory,
  type Frame,
  type NewFrame,
  type FrameComment,
  type NewFrameComment
} from '../db/schema';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await initializeDatabase();
      this.initialized = true;
    }
  }

  // Language Operations
  async saveLanguage(languageData: NewLanguage): Promise<void> {
    await this.initialize();
    await database
      .insert(languages)
      .values(languageData)
      .onConflictDoUpdate({
        target: languages.lc,
        set: {
          ...languageData,
          lastUpdated: new Date().toISOString()
        }
      });
  }

  async getLanguage(languageCode: string): Promise<Language | null> {
    await this.initialize();
    const result = await database
      .select()
      .from(languages)
      .where(eq(languages.lc, languageCode))
      .limit(1);
    return result[0] || null;
  }

  async getAllLanguages(): Promise<Language[]> {
    await this.initialize();
    return await database
      .select()
      .from(languages)
      .orderBy(asc(languages.ln));
  }

  async getLanguagesWithCollections(): Promise<Language[]> {
    await this.initialize();
    return await database
      .selectDistinct({
        lc: languages.lc,
        ln: languages.ln,
        ang: languages.ang,
        ld: languages.ld,
        gw: languages.gw,
        hc: languages.hc,
        lr: languages.lr,
        pk: languages.pk,
        alt: languages.alt,
        cc: languages.cc,
        lastUpdated: languages.lastUpdated
      })
      .from(languages)
      .innerJoin(collections, eq(languages.lc, collections.language))
      .orderBy(asc(languages.ln));
  }

  async getGatewayLanguages(): Promise<Language[]> {
    await this.initialize();
    return await database
      .select()
      .from(languages)
      .where(eq(languages.gw, true))
      .orderBy(asc(languages.ln));
  }

  async markLanguageAsHavingCollections(languageCode: string, hasCollections: boolean): Promise<void> {
    // This method is no longer needed since we don't store hasCollections in the database
    // Keeping it for backward compatibility but it's a no-op
    await this.initialize();
    // No action needed - collections relationship is maintained through foreign keys
  }

  async searchLanguages(query: string): Promise<Language[]> {
    await this.initialize();
    const searchTerm = `%${query.toLowerCase()}%`;
    return await database
      .select()
      .from(languages)
      .where(
        or(
          like(languages.ln, searchTerm),
          like(languages.ang, searchTerm),
          like(languages.lc, searchTerm)
        )
      )
      .orderBy(asc(languages.ln));
  }

  async deleteLanguage(languageCode: string): Promise<void> {
    await this.initialize();
    await database
      .delete(languages)
      .where(eq(languages.lc, languageCode));
  }

  async getLanguageStats(): Promise<{
    total: number;
    withCollections: number;
    gatewayLanguages: number;
    rtlLanguages: number;
  }> {
    await this.initialize();

    const totalResult = await database.select({ count: count() }).from(languages);
    const total = totalResult[0]?.count || 0;

    const withCollectionsResult = await database
      .selectDistinct({ lc: languages.lc })
      .from(languages)
      .innerJoin(collections, eq(languages.lc, collections.language));
    const withCollections = withCollectionsResult.length;

    const gatewayResult = await database
      .select({ count: count() })
      .from(languages)
      .where(eq(languages.gw, true));
    const gatewayLanguages = gatewayResult[0]?.count || 0;

    const rtlResult = await database
      .select({ count: count() })
      .from(languages)
      .where(eq(languages.ld, 'rtl'));
    const rtlLanguages = rtlResult[0]?.count || 0;

    return { total, withCollections, gatewayLanguages, rtlLanguages };
  }

  // Collection Operations
  async saveCollection(collectionData: NewCollection): Promise<void> {
    await this.initialize();
    await database
      .insert(collections)
      .values(collectionData)
      .onConflictDoUpdate({
        target: collections.id,
        set: {
          ...collectionData,
          lastUpdated: new Date().toISOString()
        }
      });
  }

  async getCollection(id: string): Promise<Collection | null> {
    await this.initialize();
    const result = await database
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);
    return result[0] || null;
  }

  async getAllCollections(): Promise<Collection[]> {
    await this.initialize();
    return await database
      .select()
      .from(collections)
      .orderBy(asc(collections.displayName));
  }

  async getCollectionsByLanguage(languageCode: string): Promise<Collection[]> {
    await this.initialize();
    return await database
      .select()
      .from(collections)
      .where(eq(collections.language, languageCode))
      .orderBy(asc(collections.displayName));
  }

  async getDownloadedCollections(): Promise<Collection[]> {
    await this.initialize();
    return await database
      .select()
      .from(collections)
      .where(eq(collections.isDownloaded, true))
      .orderBy(asc(collections.displayName));
  }

  async markCollectionAsDownloaded(id: string, isDownloaded: boolean): Promise<void> {
    await this.initialize();
    await database
      .update(collections)
      .set({ isDownloaded })
      .where(eq(collections.id, id));
  }

  async deleteCollection(id: string): Promise<void> {
    await this.initialize();
    await database
      .delete(collections)
      .where(eq(collections.id, id));
  }

  // Story Operations
  async saveStory(storyData: NewStory): Promise<void> {
    await this.initialize();
    await database
      .insert(stories)
      .values(storyData)
      .onConflictDoUpdate({
        target: [stories.collection_id, stories.story_number],
        set: storyData
      });
  }

  async getStory(collectionId: string, storyNumber: number): Promise<Story | null> {
    await this.initialize();
    const result = await database
      .select()
      .from(stories)
      .where(
        and(
          eq(stories.collection_id, collectionId),
          eq(stories.story_number, storyNumber)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async getStoriesByCollection(collectionId: string): Promise<Story[]> {
    await this.initialize();
    return await database
      .select()
      .from(stories)
      .where(eq(stories.collection_id, collectionId))
      .orderBy(asc(stories.story_number));
  }

  async getFavoriteStories(): Promise<Story[]> {
    await this.initialize();
    return await database
      .select()
      .from(stories)
      .where(eq(stories.is_favorite, true))
      .orderBy(asc(stories.collection_id), asc(stories.story_number));
  }

  async toggleStoryFavorite(collectionId: string, storyNumber: number): Promise<void> {
    await this.initialize();
    const story = await this.getStory(collectionId, storyNumber);
    if (story) {
      await database
        .update(stories)
        .set({ is_favorite: !story.is_favorite })
        .where(
          and(
            eq(stories.collection_id, collectionId),
            eq(stories.story_number, storyNumber)
          )
        );
    }
  }

  // Frame Operations
  async saveFrame(frameData: NewFrame): Promise<void> {
    await this.initialize();
    await database
      .insert(frames)
      .values(frameData)
      .onConflictDoUpdate({
        target: [frames.collection_id, frames.story_number, frames.frame_number],
        set: frameData
      });
  }

  async getFrame(collectionId: string, storyNumber: number, frameNumber: number): Promise<Frame | null> {
    await this.initialize();
    const result = await database
      .select()
      .from(frames)
      .where(
        and(
          eq(frames.collection_id, collectionId),
          eq(frames.story_number, storyNumber),
          eq(frames.frame_number, frameNumber)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async getFramesByStory(collectionId: string, storyNumber: number): Promise<Frame[]> {
    await this.initialize();
    return await database
      .select()
      .from(frames)
      .where(
        and(
          eq(frames.collection_id, collectionId),
          eq(frames.story_number, storyNumber)
        )
      )
      .orderBy(asc(frames.frame_number));
  }

  async getFavoriteFrames(): Promise<Frame[]> {
    await this.initialize();
    return await database
      .select()
      .from(frames)
      .where(eq(frames.is_favorite, true))
      .orderBy(asc(frames.collection_id), asc(frames.story_number), asc(frames.frame_number));
  }

  async toggleFrameFavorite(collectionId: string, storyNumber: number, frameNumber: number): Promise<void> {
    await this.initialize();
    const frame = await this.getFrame(collectionId, storyNumber, frameNumber);
    if (frame) {
      await database
        .update(frames)
        .set({ is_favorite: !frame.is_favorite })
        .where(
          and(
            eq(frames.collection_id, collectionId),
            eq(frames.story_number, storyNumber),
            eq(frames.frame_number, frameNumber)
          )
        );
    }
  }

  async searchFrameText(query: string, collectionId?: string): Promise<Frame[]> {
    await this.initialize();
    const searchTerm = `%${query}%`;

    if (collectionId) {
      return await database
        .select()
        .from(frames)
        .where(
          and(
            eq(frames.collection_id, collectionId),
            like(frames.text, searchTerm)
          )
        )
        .orderBy(asc(frames.collection_id), asc(frames.story_number), asc(frames.frame_number));
    } else {
      return await database
        .select()
        .from(frames)
        .where(like(frames.text, searchTerm))
        .orderBy(asc(frames.collection_id), asc(frames.story_number), asc(frames.frame_number));
    }
  }

  // Comment Operations
  async addComment(commentData: {
    collection_id: string;
    story_number: number;
    frame_number: number;
    comment: string;
  }): Promise<string> {
    await this.initialize();
    const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await database
      .insert(frameComments)
      .values({
        ...commentData,
        id,
        created_at: now,
        updated_at: now
      });

    return id;
  }

  async getFrameComments(collectionId: string, storyNumber: number, frameNumber: number): Promise<FrameComment[]> {
    await this.initialize();
    return await database
      .select()
      .from(frameComments)
      .where(
        and(
          eq(frameComments.collection_id, collectionId),
          eq(frameComments.story_number, storyNumber),
          eq(frameComments.frame_number, frameNumber)
        )
      )
      .orderBy(desc(frameComments.created_at));
  }

  async updateComment(commentId: string, newComment: string): Promise<void> {
    await this.initialize();
    await database
      .update(frameComments)
      .set({
        comment: newComment,
        updated_at: new Date().toISOString()
      })
      .where(eq(frameComments.id, commentId));
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.initialize();
    await database
      .delete(frameComments)
      .where(eq(frameComments.id, commentId));
  }

  async getAllComments(): Promise<FrameComment[]> {
    await this.initialize();
    return await database
      .select()
      .from(frameComments)
      .orderBy(desc(frameComments.created_at));
  }

  async getCommentsCount(collectionId: string, storyNumber: number, frameNumber: number): Promise<number> {
    await this.initialize();
    const result = await database
      .select({ count: count() })
      .from(frameComments)
      .where(
        and(
          eq(frameComments.collection_id, collectionId),
          eq(frameComments.story_number, storyNumber),
          eq(frameComments.frame_number, frameNumber)
        )
      );
    return result[0]?.count || 0;
  }

  async deleteCommentsForCollection(collectionId: string): Promise<number> {
    await this.initialize();
    const result = await database
      .delete(frameComments)
      .where(eq(frameComments.collection_id, collectionId));
    return result.changes;
  }
}

export default DatabaseManager;
