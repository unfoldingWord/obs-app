# Architecture Guide

## Project Structure

```
app/
├── (tabs)/                    # Tab-based navigation
│   ├── (read)/               # Reading interface
│   │   ├── index.tsx         # Main read screen
│   │   ├── downloads/        # Download management
│   │   ├── stories/          # Story listing
│   │   └── story/            # Story reading interface
│   ├── favorites.tsx         # Favorites management
│   └── search.tsx            # Content discovery
├── story/                    # Deep link redirects
│   └── [storyNumber]/
│       └── [frameNumber].tsx # Simplified deep link handler
├── components/               # Reusable UI components
├── _layout.tsx              # Root layout with navigation
├── languages.tsx            # Language selection
├── about.tsx               # App information
└── settings.tsx            # App settings

src/                         # Business logic
├── core/                   # Core managers and services
│   ├── CollectionsManager.ts
│   ├── StoryManager.ts
│   ├── DatabaseManager.ts
│   ├── CommentsManager.ts
│   └── UnifiedLanguagesManager.ts
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
│   ├── useStoryNavigation.ts
│   └── useReadingProgress.ts
├── db/                     # Database schema and migrations
└── utils/                  # Utility functions

android/                    # Native Android project
```

## Data Flow

### 1. Content Discovery
- App discovers available collections via Door43 Content Service (DCS) API
- Collections are validated for proper OBS format
- Invalid collections are marked and filtered out

### 2. Download Management
- Collections are downloaded as ZIP files from DCS repositories
- ZIP files are extracted and validated locally
- Content is parsed and stored in SQLite database

### 3. Local Storage
- Stories and frames are stored in SQLite with Drizzle ORM
- Reading progress and user preferences tracked locally
- Offline-first architecture ensures functionality without internet

### 4. Navigation
- File-based routing with Expo Router
- Deep linking support for sharing specific content
- User preference-aware navigation (reading modes)

## Key Components

### Core Managers

#### CollectionsManager
- **Purpose**: Handles downloading and managing story collections
- **Key Methods**:
  - `getRemoteCollectionsByLanguage()` - Discover available collections
  - `downloadCollection()` - Download and extract collection content
  - `validateCollectionStructure()` - Ensure proper OBS format
  - `getFavoriteStories()` / `getFavoriteFrames()` - Manage favorites

#### StoryManager
- **Purpose**: Manages individual story data and reading progress
- **Key Methods**:
  - `saveReadingProgress()` - Track user reading progress
  - `getAllReadingProgress()` - Get reading history
  - `addMarker()` / `getAllMarkers()` - User bookmarks
  - `getStoriesForCollection()` - Get stories in a collection

#### DatabaseManager
- **Purpose**: SQLite operations and data persistence
- **Features**:
  - Unified database with Drizzle ORM
  - Migration support from legacy databases
  - Transaction support for data integrity

#### UnifiedLanguagesManager
- **Purpose**: Language detection and RTL support
- **Features**:
  - Automatic language detection from collection metadata
  - RTL (Right-to-Left) text direction support
  - Language-specific UI adjustments

### UI Components

#### Navigation Components
- **useStoryNavigation**: Smart navigation hook with reading mode preferences
- **Deep Link Redirects**: Simplified URL routing (`obs-app://story/1/3`)
- **Tab Navigation**: Bottom tab navigation with reading/favorites/search

#### Reading Interface
- **Horizontal Reader**: Traditional frame-by-frame navigation
- **Vertical Reader**: Continuous scrolling interface
- **Reading Progress**: Automatic progress tracking and resume functionality

#### Content Management
- **Collection Browser**: Language and owner filtering
- **Download Manager**: Background downloading with progress indicators
- **Favorites System**: Story and frame-level favoriting

## Database Schema

### Collections Table
```sql
Collections {
  id: string (primary key)
  language: string
  owner: string
  displayName: string
  isDownloaded: boolean
  downloadedAt: timestamp
  metadata: json
}
```

### Stories Table
```sql
Stories {
  id: string (primary key)
  collectionId: string (foreign key)
  storyNumber: number
  title: string
  sourceReference: string
  frames: json
}
```

### Progress Table
```sql
ReadingProgress {
  id: string (primary key)
  collectionId: string
  storyNumber: number
  frameNumber: number
  timestamp: number
  totalFrames: number
}
```

### User Data Tables
```sql
UserMarkers {
  id: string (primary key)
  collectionId: string
  storyNumber: number
  frameNumber: number
  note: string
  color: string
  timestamp: number
}

FrameComments {
  id: string (primary key)
  collectionId: string
  storyNumber: number
  frameNumber: number
  comment: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

## API Integration

### Door43 Content Service (DCS)
- **Base URL**: `https://git.door43.org/api/v1/`
- **Catalog Endpoints**: For discovering available content
- **Repository Endpoints**: For downloading content packages

### Content Validation

#### Required Collection Structure
Collections can follow either of these directory structures:

**Standard Format:**
```
repository-root/
└── content/
    ├── 01.md    # Story 1
    ├── 02.md    # Story 2
    ├── ...
    └── 50.md    # Story 50
```

**Burrito Format (ingredients directory):**
```
repository-root/
└── ingredients/
    ├── 01.md    # Story 1
    ├── 02.md    # Story 2
    ├── ...
    └── 50.md    # Story 50
```

#### Validation Process
1. Collections validated via `CollectionsManager.validateCollectionStructure()`
2. Checks for either `content/` or `ingredients/` directory
3. `getRemoteCollectionsByLanguage()` returns validation status
4. Invalid collections marked with `isValid: false`
5. UI displays validation status with icons (🔧⏱️ for invalid)

#### Supported Content Format
```markdown
# Story Title

![Image Description](image-url) Text content for frame 1.

![Image Description](image-url) Text content for frame 2.

_A story from Genesis 1-5_
```

#### Source Reference Extraction
- Automatically extracts source references from last non-blank line
- Text between underscores saved as `sourceReference` in story metadata
- Provides biblical context for each story

## Deep Linking Architecture

### URL Schemes
- **Production**: `obs-app://`
- **Development (Expo Go)**: `exp://localhost:8081/--/`

### Route Structure
```
obs-app://story/[collectionId]/[storyNumber]/[frameNumber]  # Full route
obs-app://story/[storyNumber]/[frameNumber]                # Simplified route
obs-app://favorites                                         # Tab navigation
obs-app://search                                           # Tab navigation
```

### Smart Redirect System
1. Simplified routes (`obs-app://story/1/3`) redirect to full routes
2. Uses most recent collection from reading progress
3. Respects user's reading mode preference (horizontal/vertical)
4. Fallback to main screen if no reading history exists

## Performance Considerations

### Offline-First Design
- All content stored locally after download
- Reading functionality works without internet connection
- Progressive download of collections as needed

### Memory Management
- Lazy loading of story content
- Image caching for illustrations
- Efficient SQLite queries with proper indexing

### Background Processing
- Collection downloads happen in background
- Reading progress saved asynchronously
- Non-blocking UI updates during data operations
