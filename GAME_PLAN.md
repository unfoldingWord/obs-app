# Open Bible Stories (OBS) Reader App - Game Plan

## Overview
This document outlines the plan to transform the basic Expo app template into an OBS reader application that can download, store, and display Open Bible Stories from Door43 repositories.

## Core Features
1. Repository Discovery
   - Search for OBS repositories using Door43 API
   - Filter repositories by language and release status
   - Display available OBS versions

2. Content Management
   - Download OBS content from repositories
   - Convert content to app-friendly format
   - Store content locally using Expo FileSystem
   - Manage offline storage

3. Content Display
   - Story navigation
   - Story content rendering
   - Image display
   - Language selection

## Technical Implementation Steps

### Phase 1: API Integration & Repository Discovery
1. Set up API client for Door43
   - Create API service layer
   - Implement authentication handling
   - Add repository search functionality

2. Create Repository Management
   - Build repository list component
   - Implement repository filtering
   - Add repository details view

### Phase 2: Content Management
1. Implement Content Download System
   - Create download manager service
   - Handle content fetching from repositories
   - Implement progress tracking
   - Support ZIP file downloads for complete story sets
   - Handle individual story file downloads for updates

2. Content Processing
   - Create content parser for OBS format
   - Convert content to app-friendly structure
   - Handle image assets
   - Process story metadata and structure

3. Local Storage
   - Set up Expo FileSystem integration
   - Implement content caching
   - Create storage management service
   - Handle ZIP extraction and file organization

### Phase 3: UI/UX Development
1. Navigation Structure
   - Create main navigation flow
   - Implement story browser
   - Add language selector

2. Story Display
   - Build story viewer component
   - Implement image viewer
   - Add story navigation controls

3. Settings & Management
   - Create settings screen
   - Add storage management UI
   - Implement language preferences

### Phase 4: Offline Functionality
1. Offline Support
   - Implement offline detection
   - Add offline content access
   - Create sync management

2. Storage Optimization
   - Implement content cleanup
   - Add storage space management
   - Create content update system

## Technical Requirements

### Dependencies
- Expo FileSystem for local storage
- React Navigation for app navigation
- React Query for API data management
- AsyncStorage for app settings
- Image caching library

### API Integration Details

#### Base URLs
- Main API: `https://git.door43.org/api/v1`
- Raw Content: `https://git.door43.org/{owner}/{repo}/raw/branch/{path}`

#### Key API Endpoints

1. Repository Search
```
GET /api/v1/repos/search
Query Parameters:
- q: Search query (e.g., "obs")
- language: Language code (e.g., "es-419")
- page: Page number
- limit: Results per page
```

2. Repository Details
```
GET /api/v1/repos/{owner}/{repo}
```

3. Repository Releases
```
GET /api/v1/repos/{owner}/{repo}/releases
```

4. Repository Contents
```
GET /api/v1/repos/{owner}/{repo}/contents/{path}
```

5. Raw File Content
```
GET /api/v1/repos/{owner}/{repo}/raw/{path}
```

#### OBS Repository Structure
- Content files: `/content/*.md`
- Images: `/images/*.jpg`
- Manifest: `/manifest.yaml`
- Media: `/media.yaml`

#### Example Repository URL
```
https://git.door43.org/es-419_gl/es-419_obs
```

#### Content File Structure
1. Manifest File (`manifest.yaml`)
```yaml
dublin_core:
  title: Open Bible Stories
  language: es-419
  identifier: obs
  version: 0.2
  rights: CC BY-SA 4.0
```

2. Story Files (`content/*.md`)
```markdown
# Story Title

## Introduction
Story introduction text...

## Frame 1
Frame text...

![Image](images/image1.jpg)
```

#### API Authentication
- Personal Access Token required for some endpoints
- Token should be stored securely using AsyncStorage
- Token format: `Authorization: token {token}`

### Image Management

#### Image Sources
1. Default Image Set (Bundled)
   - High-quality images bundled with the app
   - Optimized for app size
   - Format: WebP for better compression
   - Resolution: 2x for retina displays

2. CDN Image Sets
   - Multiple image sets available via CDN
   - Different styles and artists
   - Different resolutions (low, medium, high)
   - Format: WebP with JPEG fallback

#### Image Download System
1. Image Set Management
```typescript
interface ImageSet {
  id: string;
  name: string;
  artist: string;
  style: string;
  resolutions: {
    low: string;
    medium: string;
    high: string;
  };
  totalSize: number;
  downloadUrl: string;
}
```

2. Download Process
   - Download manifest of available image sets
   - Track download progress
   - Handle resume/retry for failed downloads
   - Validate downloaded images
   - Clean up temporary files

3. Storage Management
   - Store images in app's cache directory
   - Implement LRU (Least Recently Used) cache
   - Allow user to clear image cache
   - Show storage usage statistics

#### Image Loading Strategy
1. Initial Load
   - Use bundled images for first launch
   - Start background download of preferred image set
   - Show download progress in settings

2. Runtime Loading
   - Check local cache first
   - Fall back to bundled images if needed
   - Download from CDN if not available locally
   - Implement progressive loading for high-res images

#### Image Set Selection
1. User Interface
   - Show image set previews
   - Display storage requirements
   - Allow switching between sets
   - Show download progress

2. Settings
   - Default image set preference
   - Auto-download settings
   - Storage management
   - Image quality preferences

### Data Structures
1. Repository Data
```typescript
interface Repository {
  id: number;
  name: string;
  language: string;
  version: string;
  release: {
    tag_name: string;
    published_at: string;
  };
}
```

2. Story Data
```typescript
interface Story {
  id: string;
  title: string;
  content: string;
  images: string[];
  frames: StoryFrame[];
}

interface StoryFrame {
  id: string;
  text: string;
  image: string;
}
```

## Testing Strategy
1. Unit Tests
   - API integration tests
   - Content processing tests
   - Storage management tests

2. Integration Tests
   - End-to-end download flow
   - Offline access tests
   - Content display tests

3. UI Tests
   - Navigation flow tests
   - Story display tests
   - Settings management tests

## Future Enhancements
1. Content Updates
   - Background sync
   - Delta updates
   - Version management

2. User Features
   - Bookmarks
   - Reading progress
   - Notes and highlights

3. Performance
   - Image optimization
   - Content preloading
   - Cache management

## Timeline Estimation
- Phase 1: 1-2 weeks
- Phase 2: 2-3 weeks
- Phase 3: 2-3 weeks
- Phase 4: 1-2 weeks

Total estimated time: 6-10 weeks

## Next Steps
1. Set up project structure
2. Implement API client
3. Create basic UI components
4. Begin content management implementation

### OBS Story Structure

#### Story File Format
1. File Naming Convention
   - Stories are numbered from 01 to 50
   - Format: `{number}.md` (e.g., `01.md`, `02.md`)
   - Located in `/content/` directory

2. Story Content Structure
```markdown
# {Story Number}. {Story Title}
![OBS Image](https://cdn.door43.org/obs/jpg/360px/obs-{lang}-{number}-{frame}.jpg)

{Story Introduction}

## Frame 1
{Frame 1 Text}
![OBS Image](https://cdn.door43.org/obs/jpg/360px/obs-{lang}-{number}-{frame}.jpg)

## Frame 2
{Frame 2 Text}
![OBS Image](https://cdn.door43.org/obs/jpg/360px/obs-{lang}-{number}-{frame}.jpg)

...

_A Bible story from: {Reference}_
```

3. Image Structure
   - CDN URL pattern: `https://cdn.door43.org/obs/jpg/360px/obs-{lang}-{number}-{frame}.jpg`
   - Available resolutions: 360px, 720px, 1080px
   - Language prefix in filename (e.g., `obs-en-01-01.jpg`)

#### Content Download Strategy
1. Initial Download
   - Download complete ZIP archive of stories
   - Extract to app's content directory
   - Process and index all stories
   - Download default image set

2. Update Process
   - Check for new releases
   - Download individual updated stories
   - Handle image updates
   - Maintain story version history

3. Storage Organization
```
app-content/
  ├── stories/
  │   ├── 01.md
  │   ├── 02.md
  │   └── ...
  ├── images/
  │   ├── 360px/
  │   ├── 720px/
  │   └── 1080px/
  └── metadata/
      ├── manifest.json
      └── story-index.json
```

#### Story Processing
1. Story Parser
```typescript
interface ProcessedStory {
  id: string;
  number: number;
  title: string;
  introduction: string;
  frames: StoryFrame[];
  reference: string;
}

interface StoryFrame {
  id: string;
  number: number;
  text: string;
  image: {
    url: string;
    resolutions: {
      low: string;
      medium: string;
      high: string;
    };
  };
}
```

2. Content Index
```typescript
interface StoryIndex {
  version: string;
  language: string;
  stories: {
    [id: string]: {
      title: string;
      lastUpdated: string;
      frameCount: number;
    };
  };
}
``` 