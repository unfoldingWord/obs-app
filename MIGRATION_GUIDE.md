# Database Migration Guide

This guide explains how to migrate from the three separate databases to the new unified database using Drizzle ORM.

## Overview

The app has been migrated from three separate SQLite databases to a single unified database:

**Before:**
- `languages.db` - LanguagesManager
- `collections.db` - CollectionsManager
- `comments.db` - CommentsManager

**After:**
- `app.db` - DatabaseManager (unified)

## What's Changed

### 1. Unified Database Schema
All data is now in a single database with proper foreign key relationships:
- Languages → Collections (one-to-many)
- Collections → Stories (one-to-many)
- Stories → Frames (one-to-many)
- Frames → Comments (one-to-many)

### 2. Type Safety with Drizzle ORM
- Full TypeScript support
- Compile-time query validation
- Auto-generated types from schema
- Better IDE support and autocomplete

### 3. Improved Performance
- Single database connection
- Optimized indexes
- WAL mode for better concurrency
- Foreign key constraints for data integrity

## How to Update Your Code

### Option 1: Use the New DatabaseManager Directly

```typescript
// Before (multiple managers)
import { LanguagesManager } from './core/LanguagesManager';
import { CollectionsManager } from './core/CollectionsManager';
import { CommentsManager } from './core/CommentsManager';

const langManager = LanguagesManager.getInstance();
const collManager = CollectionsManager.getInstance();
const commManager = CommentsManager.getInstance();

// After (unified manager)
import { DatabaseManager } from './core/DatabaseManager';

const db = DatabaseManager.getInstance();
await db.initialize();

// Language operations
const languages = await db.getAllLanguages();
const language = await db.getLanguage('en');
await db.saveLanguage({
  lc: 'en',
  ln: 'English',
  ang: 'English',
  ld: 'ltr',
  gw: false,
  // ... other fields
});

// Collection operations
const collections = await db.getAllCollections();
const collection = await db.getCollection('owner/repo');

// Story/Frame operations
const stories = await db.getStoriesByCollection('owner/repo');
const frames = await db.getFramesByStory('owner/repo', 1);

// Comment operations
const comments = await db.getFrameComments('owner/repo', 1, 1);
await db.addComment({
  collectionId: 'owner/repo',
  storyNumber: 1,
  frameNumber: 1,
  comment: 'Great frame!'
});
```

### Option 2: Use Compatibility Managers (Recommended for gradual migration)

For minimal code changes, use the unified managers that maintain the same interface:

```typescript
// Minimal changes needed - just change the import
import { UnifiedLanguagesManager } from './core/UnifiedLanguagesManager';

// Same interface as before
const langManager = UnifiedLanguagesManager.getInstance();
await langManager.initialize();

const languages = await langManager.getAllLanguages();
const language = await langManager.getLanguage('en');
```

## Migration Process

### Automatic Migration
The migration happens automatically when the app starts:

1. **App Startup**: `app/_layout.tsx` initializes the unified database
2. **Migration Check**: Looks for existing legacy databases
3. **Data Transfer**: Migrates all data to the unified database
4. **Relationships**: Establishes proper foreign key relationships
5. **Cleanup**: Marks migration as complete

### Manual Migration
If you need to run migration manually:

```typescript
import { DataMigration } from './src/db/migration';

const migration = new DataMigration();
await migration.migrateFromLegacyDatabases();
```

## API Changes

### DatabaseManager Methods

#### Language Operations
```typescript
// Get operations
await db.getLanguage(languageCode: string): Promise<Language | null>
await db.getAllLanguages(): Promise<Language[]>
await db.getLanguagesWithCollections(): Promise<Language[]>
await db.getGatewayLanguages(): Promise<Language[]>
await db.searchLanguages(query: string): Promise<Language[]>

// Save operations
await db.saveLanguage(languageData: NewLanguage): Promise<void>
await db.markLanguageAsHavingCollections(languageCode: string, hasCollections: boolean): Promise<void>

// Delete operations
await db.deleteLanguage(languageCode: string): Promise<void>

// Stats
await db.getLanguageStats(): Promise<LanguageStats>
```

#### Collection Operations
```typescript
// Get operations
await db.getCollection(id: string): Promise<Collection | null>
await db.getAllCollections(): Promise<Collection[]>
await db.getCollectionsByLanguage(languageCode: string): Promise<Collection[]>
await db.getDownloadedCollections(): Promise<Collection[]>

// Save operations
await db.saveCollection(collectionData: NewCollection): Promise<void>
await db.markCollectionAsDownloaded(id: string, isDownloaded: boolean): Promise<void>

// Delete operations
await db.deleteCollection(id: string): Promise<void>
```

#### Story Operations
```typescript
// Get operations
await db.getStory(collectionId: string, storyNumber: number): Promise<Story | null>
await db.getStoriesByCollection(collectionId: string): Promise<Story[]>
await db.getFavoriteStories(): Promise<Story[]>

// Save operations
await db.saveStory(storyData: NewStory): Promise<void>
await db.toggleStoryFavorite(collectionId: string, storyNumber: number): Promise<void>
```

#### Frame Operations
```typescript
// Get operations
await db.getFrame(collectionId: string, storyNumber: number, frameNumber: number): Promise<Frame | null>
await db.getFramesByStory(collectionId: string, storyNumber: number): Promise<Frame[]>
await db.getFavoriteFrames(): Promise<Frame[]>
await db.searchFrameText(query: string, collectionId?: string): Promise<Frame[]>

// Save operations
await db.saveFrame(frameData: NewFrame): Promise<void>
await db.toggleFrameFavorite(collectionId: string, storyNumber: number, frameNumber: number): Promise<void>
```

#### Comment Operations
```typescript
// Get operations
await db.getFrameComments(collectionId: string, storyNumber: number, frameNumber: number): Promise<FrameComment[]>
await db.getAllComments(): Promise<FrameComment[]>
await db.getCommentsCount(collectionId: string, storyNumber: number, frameNumber: number): Promise<number>

// Save operations
await db.addComment(commentData: NewFrameComment): Promise<string>
await db.updateComment(commentId: string, newComment: string): Promise<void>

// Delete operations
await db.deleteComment(commentId: string): Promise<void>
await db.deleteCommentsForCollection(collectionId: string): Promise<number>
```

## Breaking Changes

### Date Handling
- Dates are now stored as ISO strings in the database
- TypeScript types properly reflect Date objects vs string storage
- Migration handles conversion automatically

### Primary Keys
- Stories use composite keys: `(collectionId, storyNumber)`
- Frames use composite keys: `(collectionId, storyNumber, frameNumber)`
- Comments still use generated UUIDs

### Foreign Key Constraints
- Collections must reference valid languages
- Stories must reference valid collections
- Frames must reference valid stories
- Comments reference frames by composite key

## Benefits

### For Developers
1. **Single Source of Truth**: One database connection to manage
2. **Type Safety**: Full TypeScript support with auto-generated types
3. **Better Debugging**: Drizzle Studio integration for database inspection
4. **Consistent API**: Unified interface for all data operations

### For Users
1. **Better Performance**: Optimized queries and single connection
2. **Data Integrity**: Foreign key constraints prevent orphaned data
3. **Reliability**: Proper transaction handling and error management

## Troubleshooting

### Migration Issues
```typescript
// Check if migration completed
const languages = await db.getAllLanguages();
const collections = await db.getAllCollections();
console.log(`Migrated ${languages.length} languages and ${collections.length} collections`);
```

### Performance Monitoring
```typescript
// Use Drizzle Studio to monitor query performance
// Available in development mode automatically
```

### Data Validation
```typescript
// Validate relationships
const collection = await db.getCollection('owner/repo');
if (collection) {
  const language = await db.getLanguage(collection.language);
  console.log('Collection language exists:', !!language);
}
```

## Next Steps

1. **Test Migration**: Verify all your data migrated correctly
2. **Update Code**: Gradually migrate to the new DatabaseManager
3. **Remove Legacy Code**: Eventually remove old manager references
4. **Optimize Queries**: Use Drizzle Studio to optimize performance
5. **Add Features**: Take advantage of improved relationships for new features

## Support

If you encounter issues:
1. Check the console for migration logs
2. Use Drizzle Studio to inspect database state
3. Verify foreign key relationships
4. Check for data corruption in legacy databases

The migration preserves all existing functionality while providing a foundation for improved features and performance.
