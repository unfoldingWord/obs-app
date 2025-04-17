# UI Design Specification

## Core Components

### 1. Language Card
```typescript
interface LanguageCardProps {
  language: string;
  region?: string;
  family?: string;
  collectionCount: number;
  ownerCount: number;
  onPress: () => void;
}
```

### 2. Owner Card
```typescript
interface OwnerCardProps {
  name: string;
  collectionCount: number;
  lastUpdated: Date;
  onPress: () => void;
}
```

### 3. Collection Card
```typescript
interface CollectionCardProps {
  title: string;
  version: string;
  lastUpdated: Date;
  downloadStatus: 'not_downloaded' | 'downloading' | 'downloaded' | 'update_available';
  shareStatus?: 'not_shared' | 'sharing' | 'shared';
  onPress: () => void;
  onDownload: () => void;
  onShare: () => void;
}
```

### 4. Quality Badge
```typescript
interface QualityBadgeProps {
  verified: boolean;
}
```

### 5. Sharing Package
```typescript
interface SharingPackage {
  id: string;
  collections: string[];
  size: number;
  created: Date;
  sharedWith: string[];
  status: 'preparing' | 'ready' | 'sharing' | 'completed';
}
```

## Screen Layouts

### 1. Language Selection Screen
```
+----------------------------------+
|  Search Languages                |
+----------------------------------+
|  [Region Filter] [Family Filter] |
+----------------------------------+
|  [Language Card]                 |
|  - Language Name                 |
|  - Region/Family                 |
|  - Collection Count              |
|  - Owner Count                   |
+----------------------------------+
|  [Language Card]                 |
|  ...                            |
+----------------------------------+
```

### 2. Owner Selection Screen
```
+----------------------------------+
|  Back | Select Owner             |
+----------------------------------+
|  Selected Language: [Language]   |
+----------------------------------+
|  [Owner Card]                    |
|  - Owner Name                    |
|  - Collection Count              |
|  - Last Updated                  |
+----------------------------------+
|  [Owner Card]                    |
|  ...                            |
+----------------------------------+
```

### 3. Collection Browser Screen
```
+----------------------------------+
|  Back | Owner Collections        |
+----------------------------------+
|  Selected Owner: [Owner Name]    |
+----------------------------------+
|  [Collection Card]               |
|  - Title                         |
|  - Version Info                  |
|  - Last Updated                  |
|  - Download Button               |
|  - Share Button                  |
+----------------------------------+
|  [Collection Card]               |
|  ...                            |
+----------------------------------+
```

### 4. Collection Details Screen
```
+----------------------------------+
|  Back | Collection Details       |
+----------------------------------+
|  [Collection Header]             |
|  - Title                         |
|  - Owner                         |
|  - Version Info                  |
+----------------------------------+
|  [Metadata Section]              |
|  - Description                   |
|  - Source Info                   |
|  - Last Updated                  |
|  - Download Size                 |
+----------------------------------+
|  [Action Buttons]                |
|  - Download/Update               |
|  - Share                         |
|  - Create Package                |
+----------------------------------+
|  [Content Preview]               |
|  - Story List                    |
|  - Sample Content                |
+----------------------------------+
```

### 5. Sharing Screen
```
+----------------------------------+
|  Back | Share Collections        |
+----------------------------------+
|  [Selected Collections]          |
|  - Collection 1                  |
|  - Collection 2                  |
|  - Add More                      |
+----------------------------------+
|  [Package Options]               |
|  - Package Name                  |
|  - Include Metadata              |
|  - Optimize Size                 |
+----------------------------------+
|  [Sharing Methods]               |
|  - Device-to-Device              |
|  - Create Package File           |
+----------------------------------+
|  [Transfer Progress]             |
|  - Connection Status             |
|  - Transfer Speed                |
|  - Time Remaining                |
+----------------------------------+
|  [Receipt]                       |
|  - Transfer Complete             |
|  - Verification Code             |
|  - Share Again                   |
+----------------------------------+
```

### 6. Offline Library Screen
```
+----------------------------------+
|  My Library                      |
+----------------------------------+
|  Search Downloaded Content       |
+----------------------------------+
|  [Collection Group]              |
|  - Language Header               |
|  - [Collection Card]             |
|  - [Collection Card]             |
+----------------------------------+
|  [Collection Group]              |
|  ...                            |
+----------------------------------+
|  [Sharing History]               |
|  - Recent Shares                 |
|  - Shared Packages               |
+----------------------------------+
|  [Storage Info]                  |
|  - Used Space                    |
|  - Available Space               |
|  - Manage Storage                |
+----------------------------------+
```

## Navigation Flow

```
Language Selection
       ↓
Owner Selection
       ↓
Collection Browser
       ↓
Collection Details
       ↓
Sharing Screen
       ↓
Offline Library
       ↓
Settings
```

## UI Patterns

### 1. Download States
- Not downloaded (gray)
- Downloading (blue with progress)
- Downloaded (green)
- Update available (orange)

### 2. Sharing States
- Not shared (gray)
- Sharing (blue with progress)
- Shared (green)
- Error (red)

### 3. Filter Chips
- Horizontal scrollable list
- Multiple selection support
- Clear all option
- Count indicators

### 4. Search Patterns
- Instant search
- Filter integration
- Recent searches
- Search suggestions

## Accessibility Requirements

### 1. Text
- Minimum font size: 14pt
- High contrast ratios
- Scalable text
- Clear hierarchy

### 2. Touch Targets
- Minimum size: 44x44pt
- Adequate spacing
- Clear feedback
- Error prevention

### 3. Navigation
- Consistent patterns
- Clear labels
- Back button always visible
- Breadcrumb navigation

### 4. Color
- Color-blind friendly
- High contrast
- Meaningful color coding
- Alternative indicators
