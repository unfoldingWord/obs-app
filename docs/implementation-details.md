# Implementation Details

## Data Sources

### Story Collections
- Collections are stored in DCS (Door43 Content Service), a fork of Gitea
- Collections are part of the "Open Bible Stories" subject
- Collections are discovered through catalog endpoints
- Collections are downloaded as ZIP files through repository endpoints

### DCS API Endpoints

#### Catalog Endpoints (Discovery)
```
GET /api/v1/catalog/list/languages
Parameters:
- subject: "Open Bible Stories"
- stage: "prod"
```
Returns list of available languages for Open Bible Stories

```
GET /api/v1/catalog/list/owners
Parameters:
- subject: "Open Bible Stories"
- lang: {language_code}
- stage: "prod"
```
Returns list of owners who have published collections in the specified language

```
GET /api/v1/catalog/search
Parameters:
- subject: "Open Bible Stories"
- lang: {language_code}
- owner: {owner_name}
- sort: "title"
- order: "asc"
- stage: "prod"
```
Returns list of collections matching the criteria

#### Repository Endpoints (Download)
```
GET /api/v1/repos/{owner}/{repo}/archive/zipball
```
Downloads repository contents as ZIP file

### Collection Processing

#### ZIP Structure
```
collection.zip/
├── metadata.json
├── stories/
│   ├── story1/
│   │   ├── content.json
│   │   └── frames/
│   │       ├── frame1.json
│   │       ├── frame2.json
│   │       └── ...
│   ├── story2/
│   └── ...
└── version.json
```

#### Processing Steps
1. Discover collections through catalog endpoints
2. Download collection ZIP through repository endpoint
3. Extract ZIP contents
4. Validate collection structure
5. Process metadata
6. Process stories
7. Process image pack references
8. Store in local database

#### ZIP Processing
- Stream-based extraction
- Progress tracking
- Error handling
- Integrity verification
- Storage optimization

## Data Formats

### Collection Metadata (metadata.json)
```json
{
  "id": "unique-collection-id",
  "title": "Collection Title",
  "owner": "owner-name",
  "language": "language-code",
  "targetAudience": "children|adults|bible-study",
  "description": "Collection description",
  "version": "1.0.0",
  "lastUpdated": "2024-03-20T12:00:00Z",
  "storyCount": 50,
  "totalSize": 1024000,
  "imagePack": {
    "id": "default-image-pack",
    "version": "1.0.0",
    "url": "https://example.com/image-packs/default"
  }
}
```

### Story Content (content.json)
```json
{
  "id": "unique-story-id",
  "title": "Story Title",
  "frameCount": 5,
  "frames": [
    {
      "id": "frame1",
      "text": "Story text for this frame",
      "imageId": "frame1",
      "audio": "audio/frame1.mp3"
    },
    {
      "id": "frame2",
      "text": "Story text for this frame",
      "imageId": "frame2",
      "audio": "audio/frame2.mp3"
    }
  ],
  "metadata": {
    "bibleReference": "Genesis 1:1-5",
    "themes": ["creation", "god"],
    "difficulty": "easy|medium|hard"
  }
}
```

### Image Pack Metadata
```json
{
  "id": "image-pack-id",
  "name": "Image Pack Name",
  "version": "1.0.0",
  "description": "Image pack description",
  "frameCount": 50,
  "images": [
    {
      "id": "frame1",
      "path": "images/frame1.png",
      "size": 102400,
      "dimensions": {
        "width": 800,
        "height": 600
      }
    },
    {
      "id": "frame2",
      "path": "images/frame2.png",
      "size": 102400,
      "dimensions": {
        "width": 800,
        "height": 600
      }
    }
  ]
}
```

### Version Information (version.json)
```json
{
  "currentVersion": "1.0.0",
  "releaseDate": "2024-03-20T12:00:00Z",
  "changes": [
    {
      "version": "1.0.0",
      "date": "2024-03-20T12:00:00Z",
      "description": "Initial release"
    }
  ]
}
```

## Storage and Caching

### Local Storage
- Collections are stored in app's local storage
- Organized by:
  - Language
  - Owner
  - Target audience
  - Version
- ZIP-based storage optimization

### Image Storage
- Default image pack bundled with app
- Additional image packs downloaded on demand
- Images organized by:
  - Image pack
  - Frame ID
  - Version
- Optimized for:
  - Storage efficiency
  - Fast loading
  - Offline access

### Image Pack Management
- Default image pack pre-installed
- Additional packs downloadable
- Pack version tracking
- Pack switching capability
- Storage optimization for multiple packs

### Cache Management
- Automatic cache cleanup
- Version-based updates
- Storage quota management
- Background downloads
- Image pack cleanup
- ZIP cache management

## Data Synchronization

### Version Checking
- Checks for updates on app launch
- Compares local version with DCS version
- Downloads only changed content
- Maintains version history
- Checks image pack updates

### Update Process
1. Check for updates via catalog endpoints
2. Download collection ZIP through repository endpoint
3. Extract and process ZIP
4. Verify integrity
5. Apply update
6. Clean up old version
7. Update image packs if needed

## Offline Functionality

### Data Access
- All content available offline
- Search functionality works offline
- Story browsing works offline
- Image display works offline
- Default image pack always available

### Sharing
- Device-to-device transfer
- Version-aware sharing
- Progress tracking
- Error handling
- Image pack sharing
- ZIP-based sharing

## Security

### Data Integrity
- Checksum verification
- Version validation
- Content verification
- Error recovery
- Image pack verification
- ZIP integrity checks

### Access Control
- DCS repository access control
- Content validation
- User authentication
- Data encryption
- Image pack access control
- ZIP access control

## Performance Considerations

### Image Optimization
- Compressed images in packs
- Progressive loading
- Cache management
- Memory optimization
- Pack-based loading

### Storage Optimization
- Efficient data structures
- Compression where possible
- Cleanup routines
- Storage quotas
- Pack-based storage
- ZIP-based storage

### Network Optimization
- Background downloads
- Incremental updates
- Bandwidth management
- Connection handling
- Pack-based downloads
- ZIP streaming
