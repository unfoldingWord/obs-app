# Collection Import/Export System

## Overview

The Collection Import/Export System enables users to share collections between devices, particularly useful for offline scenarios where users need to transfer collections via SD cards, USB drives, or other means without internet connectivity.

**Important Design Decisions:**

- **Scripture Burrito Compliance**: Follows Scripture Burrito 1.0.0 specification for standardized packaging
- **Remote Format Compatibility**: Export format closely matches the remote import format for consistency
- **No Image Export**: Frame images are bundled with the app, so they don't need to be exported/imported
- **Simplified Structure**: Single metadata.json file in Scripture Burrito format
- **Story Scope**: Each story ingredient includes its scope mapping to Bible references

## Architecture

### Core Components

1. **CollectionImportExportManager** - Main service for import/export operations
2. **CollectionImportExportUI** - React Native UI components
3. **Scripture Burrito Format** - Standardized packaging with ingredients folder
4. **Version Management** - Handles compatibility and conflicts

### Data Structure

```
export-file.zip                   # Scripture Burrito compliant package
├── metadata.json                 # Scripture Burrito metadata
└── ingredients/                  # Content folder per Scripture Burrito spec
    ├── 01.md                     # Story 1 in markdown format with scope
    ├── 02.md                     # Story 2 in markdown format with scope
    ├── ...                       # Additional stories
    └── thumbnail.jpg             # Collection thumbnail
```

### Scripture Burrito Compliance

The export format follows the [Scripture Burrito specification](https://docs.burrito.bible/) v1.0.0:

**Root Metadata** (`metadata.json`):

```json
{
  "format": "scripture burrito",
  "meta": {
    "version": "1.0.0",
    "category": "source",
    "generator": {
      "softwareName": "OBS App",
      "softwareVersion": "1.0.0"
    },
    "dateCreated": "2024-01-20T12:00:00.000Z"
  },
  "identification": {
    "name": {
      "en": "Collection Title"
    },
    "description": {
      "en": "Collection description"
    }
  },
  "languages": [
    {
      "tag": "en",
      "name": {
        "en": "English"
      },
      "scriptDirection": "ltr"
    }
  ],
  "type": {
    "flavorType": {
      "name": "gloss",
      "flavor": {
        "name": "textStories"
      }
    }
  },
  "copyright": {
    "shortStatements": [
      {
        "statement": "Collection copyright statement",
        "lang": "en"
      }
    ]
  },
  "ingredients": {
    "01.md": {
      "checksum": {
        "md5": "<md5hash>"
      },
      "mimeType": "text/markdown",
      "role": "content",
      "scope": {
        "GEN": ["1-2"]
      }
    },
    "02.md": {
      "checksum": {
        "md5": "<md5hash>"
      },
      "mimeType": "text/markdown",
      "role": "content",
      "scope": {
        "GEN": ["3"]
      }
    },
    "thumbnail.jpg": {
      "checksum": {
        "md5": "<md5hash>"
      },
      "mimeType": "image/jpeg",
      "role": "thumbnail"
    }
  }
}
```

## Implementation Details

### Export Process

1. **Selection Phase**
   - User selects collections to export
   - Configure export options

2. **Validation Phase**
   - Verify collection completeness
   - Check available storage space
   - Validate user permissions

3. **Export Phase**
   - Create temporary working directory
   - Create Scripture Burrito package structure:
     - Generate `metadata.json` with Scripture Burrito compliance
     - Create `ingredients/` folder for content
     - Export story `.md` files to ingredients folder with scope information
     - Export `thumbnail.jpg` to ingredients folder (if available)
     - Calculate checksums for all ingredients
   - Create compressed archive
   - Cleanup temporary files

4. **Sharing Phase**
   - Save to device storage
   - Share via platform sharing mechanisms
   - Copy to external storage if available

### Import Process

1. **File Selection**
   - User selects import file
   - Validate file format and accessibility

2. **Validation Phase**
   - Read and validate Scripture Burrito metadata
   - Check format version compatibility
   - Detect potential conflicts

3. **Conflict Resolution**
   - Present conflicts to user
   - Allow selective resolution
   - Configure import options

4. **Import Phase**
   - Validate `metadata.json` structure
   - Parse ingredients from `ingredients/` folder
   - Verify checksums and scope information
   - Import collections using same logic as remote imports
   - Handle conflicts according to user preferences
   - Update database atomically

5. **Cleanup Phase**
   - Remove temporary files
   - Update collection cache
   - Notify user of results

### Database Operations

```typescript
// Atomic collection import
await database.transaction(async (tx) => {
  // Delete existing collection if overwriting
  if (options.overwriteExisting) {
    await tx.delete(collections).where(eq(collections.id, collectionId));
  }

  // Insert collection data
  await tx.insert(collections).values(collectionData);

  // Parse and insert stories from markdown files
  for (const storyFile of storyFiles) {
    const { storyData, framesData, scope } = parseStoryMarkdown(storyFile);
    await tx.insert(stories).values({
      ...storyData,
      scope: JSON.stringify(scope)
    });
    await tx.insert(frames).values(framesData);
  }
});
```

### Remote Format Parsing

```typescript
// Parse story content in same format as remote
private parseAndImportStoryContent(collectionId: string, fileName: string, content: string) {
  // Extract story number from filename (01.md -> 1)
  const storyNumber = parseInt(fileName.replace('.md', ''), 10);

  // Extract title from first line (# Title)
  const titleLine = content.split('\n').find(line => line.startsWith('# '));
  const title = titleLine ? titleLine.substring(2).trim() : `Story ${storyNumber}`;

  // Extract scope information from metadata
  const scopeMatch = content.match(/<!-- scope: (.*?) -->/);
  const scope = scopeMatch ? JSON.parse(scopeMatch[1]) : {};

  // Parse frames using same regex as remote processing
  const frameRegex = /!\[OBS Image\]\(([^)]+)\)\s*\n\s*\n([^!]+?)(?=\n\s*!\[|$)/g;
  // ... process frames

  return { title, scope, frames };
}
```

## Usage Examples

### Basic Export

```typescript
const manager = CollectionImportExportManager.getInstance();

const options: ExportOptions = {
  compressionLevel: 6,
  collectionId: 'unfoldingword/obs-en',
};

await manager.exportCollection(
  '/path/to/obs-english.zip',
  options,
  (progress, status) => {
    console.log(`${progress}%: ${status}`);
  }
);

// Results in Scripture Burrito structure:
// metadata.json (Scripture Burrito metadata with scope)
// ingredients/01.md (includes scope in content)
// ingredients/02.md (includes scope in content)
// ingredients/thumbnail.jpg
```

## Dependencies

### Required Packages

```
