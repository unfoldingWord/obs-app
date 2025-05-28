import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, blob, real, index, primaryKey } from 'drizzle-orm/sqlite-core';

// Languages Table
export const languages = sqliteTable(
  'languages',
  {
    lc: text('lc').primaryKey(), // Language code (ISO 639-3)
    ln: text('ln').notNull(), // Native name
    ang: text('ang').notNull(), // English name
    ld: text('ld').notNull().default('ltr'), // Text direction
    gw: integer('gw', { mode: 'boolean' }).notNull().default(false), // Gateway language
    hc: text('hc').notNull().default(''), // Home country code
    lr: text('lr').notNull().default(''), // Language region
    pk: integer('pk').notNull().default(0), // Door43 catalog primary key
    alt: text('alt', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`), // Alternative names
    cc: text('cc', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`), // Country codes
    lastUpdated: text('last_updated')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    gwIdx: index('idx_languages_gw').on(table.gw),
    lrIdx: index('idx_languages_lr').on(table.lr),
  })
);

// Collections Table
export const collections = sqliteTable(
  'collections',
  {
    id: text('id').primaryKey(), // Format: "owner/repository-name"
    owner: text('owner').notNull(),
    language: text('language')
      .notNull()
      .references(() => languages.lc, { onDelete: 'cascade' }),
    displayName: text('display_name').notNull(),
    version: text('version').notNull(),
    imageSetId: text('image_set_id').notNull(),
    lastUpdated: text('last_updated')
      .notNull()
      .default(sql`(datetime('now'))`),
    isDownloaded: integer('is_downloaded', { mode: 'boolean' }).notNull().default(false),
    metadata: text('metadata', { mode: 'json' }).$type<{
      description?: string;
      targetAudience?: string;
      thumbnail?: string;
    }>(),
  },
  (table) => ({
    languageIdx: index('idx_collections_language').on(table.language),
    isDownloadedIdx: index('idx_collections_downloaded').on(table.isDownloaded),
  })
);

// Stories Table
export const stories = sqliteTable(
  'stories',
  {
    collection_id: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    story_number: integer('story_number').notNull(),
    title: text('title').notNull(),
    is_favorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collection_id, table.story_number] }),
    favoriteIdx: index('idx_stories_favorite').on(table.is_favorite),
  })
);

// Frames Table
export const frames = sqliteTable(
  'frames',
  {
    collection_id: text('collection_id').notNull(),
    story_number: integer('story_number').notNull(),
    frame_number: integer('frame_number').notNull(),
    image_url: text('image_url').notNull(),
    text: text('text').notNull(),
    is_favorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collection_id, table.story_number, table.frame_number] }),
    favoriteIdx: index('idx_frames_favorite').on(table.is_favorite),
    storyFK: index('idx_frames_story').on(table.collection_id, table.story_number),
  })
);

// Comments Table
export const frameComments = sqliteTable(
  'frame_comments',
  {
    id: text('id').primaryKey(),
    collection_id: text('collection_id').notNull(),
    story_number: integer('story_number').notNull(),
    frame_number: integer('frame_number').notNull(),
    comment: text('comment').notNull(),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    frameIdx: index('idx_frame_comments_frame').on(
      table.collection_id,
      table.story_number,
      table.frame_number
    ),
    createdAtIdx: index('idx_frame_comments_created').on(table.created_at),
  })
);

// Export types
export type Language = typeof languages.$inferSelect;
export type NewLanguage = typeof languages.$inferInsert;

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;

export type Frame = typeof frames.$inferSelect;
export type NewFrame = typeof frames.$inferInsert;

export type FrameComment = typeof frameComments.$inferSelect;
export type NewFrameComment = typeof frameComments.$inferInsert;
