# Unified Database Architecture

This directory contains the new unified database implementation using Drizzle ORM. Previously, the app used three separate SQLite databases:

- `languages.db` - Language metadata and configuration
- `collections.db` - Collections, stories, frames, and files
- `comments.db` - User comments on frames

## Migration to Unified Database

The new architecture consolidates all data into a single database (`app.db`) with proper foreign key relationships and improved performance. This provides several benefits:

### Benefits
1. **Data Consistency**: Proper foreign key relationships ensure data integrity
2. **Better Performance**: Single database connection, optimized queries
3. **Simplified Maintenance**: One database to manage instead of three
4. **Type Safety**: Full TypeScript support with Drizzle ORM
5. **Better Development Experience**: Drizzle Studio integration for database inspection

### Database Schema

The unified schema includes the following tables:

#### Languages Table
- Primary table for language metadata
- ISO 639-3 language codes as primary keys
- Gateway language flags, text direction, country information

#### Collections Table
- Stores collection metadata
- Foreign key relationship to languages table
- Download status and versioning information

#### Stories Table
- Individual stories within collections
- Composite primary key (collection_id, story_number)
- Markdown content storage and favorites

#### Frames Table
- Individual frames within stories
- Composite primary key (collection_id, story_number, frame_number)
- Image URLs, text content, and favorites

#### Frame Comments Table
- User comments on specific frames
- References frames by collection_id, story_number, frame_number
- Timestamps for creation and updates

#### Collection Files Table
- Stores raw file contents from collection ZIP downloads
- Used for processing and extracting stories/frames

## File Structure

```
src/db/
├── README.md           # This documentation
├── schema.ts           # Drizzle schema definitions
├── database.ts         # Database connection and initialization
├── migration.ts        # Migration utilities for legacy data
└── types.ts           # TypeScript type exports
```

## Usage

### Basic Database Operations

```typescript
import { DatabaseManager } from '@/core/DatabaseManager';

const db = DatabaseManager.getInstance();
await db.initialize();

// Language operations
const language = await db.getLanguage('en');
await db.saveLanguage({
  lc: 'en',
  ln: 'English',
  ang: 'English',
  // ... other fields
});

// Collection operations
const collections = await db.getCollectionsByLanguage('en');
await db.saveCollection({
  id: 'owner/repo',
  language: 'en',
  // ... other fields
});

// Story/Frame operations
const stories = await db.getStoriesByCollection('owner/repo');
const frames = await db.getFramesByStory('owner/repo', 1);
```

### Legacy Compatibility

For backward compatibility, use the unified managers that maintain the same interface:

```typescript
import { UnifiedLanguagesManager } from '@/core/UnifiedLanguagesManager';

const languageManager = UnifiedLanguagesManager.getInstance();
await languageManager.initialize();

// Same interface as the original LanguagesManager
const languages = await languageManager.getAllLanguages();
```

## Migration Process

The migration happens automatically on app startup and includes:

1. **Backup Check**: Identifies existing legacy databases
2. **Data Migration**: Transfers all data to the unified database
3. **Relationship Building**: Establishes proper foreign key relationships
4. **Cleanup Preparation**: Prepares for eventual removal of legacy databases

### Migration Utility

```typescript
import { DataMigration } from '@/db/migration';

const migration = new DataMigration();

// Full migration process
await migration.migrateFromLegacyDatabases();

// Optional: Create backups
await migration.createBackupOfLegacyDatabases();
```

### Manual Migration

If automatic migration fails, you can run it manually:

```typescript
import { DatabaseManager } from '@/core/DatabaseManager';
import { DataMigration } from '@/db/migration';

// Initialize new database
const db = DatabaseManager.getInstance();
await db.initialize();

// Run migration
const migration = new DataMigration();
await migration.migrateFromLegacyDatabases();
```

## Development Tools

### Drizzle Studio

The app includes Drizzle Studio integration for database inspection:

1. Start the app in development mode
2. Drizzle Studio will be automatically available
3. Access via the Expo development tools

### Database Inspection

```typescript
// Get database statistics
const stats = await db.getLanguageStats();
console.log('Database stats:', stats);

// Verify relationships
const collections = await db.getCollectionsByLanguage('en');
const stories = await db.getStoriesByCollection(collections[0].id);
```

## Performance Considerations

1. **Indexes**: Optimized indexes on frequently queried columns
2. **Batch Operations**: Use transactions for bulk operations
3. **Connection Management**: Single connection with WAL mode
4. **Foreign Keys**: Proper relationship constraints

## Troubleshooting

### Migration Issues

If migration fails:

1. Check console logs for specific error messages
2. Verify legacy database accessibility
3. Ensure sufficient storage space
4. Check for data corruption in legacy databases

### Performance Issues

1. Monitor query performance using Drizzle Studio
2. Check for missing indexes on query patterns
3. Consider batch operations for large datasets
4. Use proper WHERE clauses to limit result sets

### Data Integrity

1. Foreign key constraints ensure relationship integrity
2. Use transactions for multi-table operations
3. Validate data before insertion
4. Regular backup procedures recommended

## Future Considerations

1. **Schema Evolution**: Use Drizzle migrations for future schema changes
2. **Performance Monitoring**: Add query performance tracking
3. **Backup Strategy**: Implement automated backup procedures
4. **Data Export**: Consider data export functionality for users
5. **Cleanup**: Eventually remove legacy database support
