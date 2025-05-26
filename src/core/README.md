# CollectionsManager

A core service that manages Open Bible Stories collections in the application. It provides a clear separation between remote Door43 repository operations and local collection management, with SQLite as the storage backend.

## Purpose

The CollectionsManager serves as the central point for:
- Managing remote Door43 OBS repositories
- Handling local collection storage and retrieval
- Providing offline access to downloaded collections
- Managing collection metadata, stories, frames, and thumbnails

## Core Responsibilities

1. **Remote Repository Management**
   - Fetching available languages from Door43
   - Retrieving collections by language
   - Downloading and processing repository data
   - Converting repository data to local format

2. **Local Collection Management**
   - Storing collections in SQLite
   - Managing collection stories and frames
   - Handling favorites
   - Managing thumbnails

## Data Models

### Collection
```typescript
interface Collection {
  id: string;          // Format: "owner/repository-name"
  owner: string;       // Repository owner
  language: string;    // Language code
  displayName: string; // Human-readable name
  version: string;     // Collection version
  imageSetId: string;  // Associated image set
  lastUpdated: Date;   // Last update timestamp
  isDownloaded: boolean; // Download status
  metadata?: {         // Additional collection data
    description?: string;
    targetAudience?: string;
    thumbnail?: string;
  };
}

interface Story {
  id: string;
  collectionId: string;
  title: string;
  content: string;
  isFavorite: boolean;
  // ... other story metadata
}

interface Frame {
  id: string;
  storyId: string;
  collectionId: string;
  imageUrl: string;
  text: string;
  isFavorite: boolean;
  // ... other frame metadata
}
```

## API Reference

### Remote Operations
```typescript
// Get available languages from Door43
getRemoteLanguages(): Promise<string[]>

// Get collections for a language from Door43
getRemoteCollectionsByLanguage(language: string): Promise<Collection[]>

// Download and process a remote collection
downloadRemoteCollection(collection: Collection): Promise<void>
```

### Local Collection Operations
```typescript
// Get all local collections
getLocalCollections(): Promise<Collection[]>

// Get collections by language
getLocalCollectionsByLanguage(language: string): Promise<Collection[]>

// Get available languages from local storage
getLocalLanguages(): Promise<string[]>

// Get a specific collection
getCollectionById(id: string): Promise<Collection | null>

// Get all stories in a collection
getCollectionStories(collectionId: string): Promise<Story[]>

// Get a specific story
getCollectionStory(collectionId: string, storyId: string): Promise<Story | null>

// Get all frames in a collection
getCollectionFrames(collectionId: string): Promise<Frame[]>

// Get a specific frame
getCollectionFrame(collectionId: string, frameId: string): Promise<Frame | null>
```

### Favorites Management
```typescript
// Toggle story favorite status
toggleStoryFavorite(collectionId: string, storyId: string): Promise<void>

// Toggle frame favorite status
toggleFrameFavorite(collectionId: string, frameId: string): Promise<void>

// Get favorite stories
getFavoriteStories(): Promise<Story[]>

// Get favorite frames
getFavoriteFrames(): Promise<Frame[]>
```

### Thumbnail Management
```typescript
// Get collection thumbnail
getCollectionThumbnail(id: string): Promise<string | null>

// Save collection thumbnail
saveCollectionThumbnail(id: string, imageData: string): Promise<void>

// Delete collection thumbnail
deleteCollectionThumbnail(id: string): Promise<void>
```

## Database Schema

### Collections Table
```sql
CREATE TABLE collections (
  id TEXT PRIMARY KEY,           -- Format: "owner/repository-name"
  owner TEXT NOT NULL,           -- Repository owner
  language TEXT NOT NULL,        -- Language code
  displayName TEXT NOT NULL,     -- Display name
  version TEXT NOT NULL,         -- Version string
  imageSetId TEXT NOT NULL,      -- Image set reference
  lastUpdated TEXT NOT NULL,     -- ISO timestamp
  isDownloaded INTEGER NOT NULL, -- Boolean as integer
  metadata TEXT                  -- JSON string
)
```

### Stories Table
```sql
CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  FOREIGN KEY (collection_id) REFERENCES collections(id)
)
```

### Frames Table
```sql
CREATE TABLE frames (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  text TEXT NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  FOREIGN KEY (story_id) REFERENCES stories(id),
  FOREIGN KEY (collection_id) REFERENCES collections(id)
)
```

## Usage Examples

### Remote Operations
```typescript
const manager = CollectionsManager.getInstance();
await manager.initialize();

// Get available languages
const languages = await manager.getRemoteLanguages();

// Get collections for a language
const collections = await manager.getRemoteCollectionsByLanguage('en');

// Download a collection
const collection = collections[0];
await manager.downloadRemoteCollection(collection);
```

### Local Operations
```typescript
// Get local collections
const localCollections = await manager.getLocalCollections();

// Get stories from a collection
const stories = await manager.getCollectionStories('owner/repo-name');

// Get frames from a story
const frames = await manager.getCollectionFrames('owner/repo-name');

// Toggle favorites
await manager.toggleStoryFavorite('owner/repo-name', 'story-1');
await manager.toggleFrameFavorite('owner/repo-name', 'frame-1');
```

## Error Handling

The manager implements a consistent error handling strategy:
- Network errors are caught and logged
- Database operations are wrapped in transactions
- Failed operations return null/empty results
- Critical errors are propagated up the stack

## Dependencies
- `expo-sqlite`: Database operations
- `jszip`: Archive handling
- `expo-image-manipulator`: Image processing

## Best Practices

1. **Initialization**
   - Always call `initialize()` before using the manager
   - Handle initialization errors appropriately

2. **Resource Management**
   - Clean up unused collections
   - Monitor storage usage
   - Handle download failures gracefully

3. **Error Handling**
   - Implement proper error boundaries
   - Log errors for debugging
   - Provide user feedback for failures

4. **Performance**
   - Use language filtering to reduce data transfer
   - Implement proper caching strategies
   - Monitor memory usage with large collections
