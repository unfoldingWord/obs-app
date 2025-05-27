# OBS App Issues Analysis & Solutions

## Current Issues Analysis

Based on the codebase analysis, here are the identified issues and their proposed solutions:

## 1. 🗑️ Delete Collections from App

**Current State**: Collections can be downloaded but there's no UI to delete them.

**Solution**:
- Add delete functionality to collection items
- Implement confirmation dialog
- Update CollectionsManager to handle cleanup

**Implementation**:
```typescript
// Add to CollectionsManager.ts
async deleteCollection(id: string): Promise<void> {
  // Already exists but needs UI integration
}

// Add delete button to collection items with confirmation
const handleDeleteCollection = async (collectionId: string) => {
  Alert.alert(
    "Delete Collection",
    "Are you sure you want to delete this collection? This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await collectionsManager.deleteCollection(collectionId);
          // Refresh collections list
        }
      }
    ]
  );
};
```

## 2. 📊 Store More Metadata (Language Details)

**Current State**: Basic metadata exists but language details are limited.

**Solution**: Extend Collection interface and database schema

**Implementation**:
```typescript
// Extend Collection interface
interface Collection {
  id: string;
  owner: string;
  language: string;
  displayName: string;
  version: string;
  imageSetId: string;
  lastUpdated: Date;
  isDownloaded: boolean;
  metadata?: {
    description?: string;
    targetAudience?: string;
    thumbnail?: string;
    languageDetails?: {
      direction: 'ltr' | 'rtl';
      fontFamily?: string;
      region?: string;
      script?: string;
    };
    stats?: {
      totalStories: number;
      totalFrames: number;
      downloadSize: number;
    };
  };
}

// Update database schema
CREATE TABLE IF NOT EXISTS collections (
  // ... existing fields
  language_direction TEXT DEFAULT 'ltr',
  language_region TEXT,
  language_script TEXT,
  total_stories INTEGER DEFAULT 0,
  total_frames INTEGER DEFAULT 0,
  download_size INTEGER DEFAULT 0
);
```

## 3. 📖 Show Correct Title in Continue Reading Section

**Current State**: Continue reading may not show proper titles.

**Solution**: Implement proper story title resolution and progress tracking

**Implementation**:
```typescript
// Add to storyManager.ts
interface ReadingProgress {
  collectionId: string;
  storyNumber: number;
  frameNumber: number;
  storyTitle: string;
  lastRead: Date;
  progress: number; // percentage
}

async getLastReadStory(): Promise<ReadingProgress | null> {
  const result = await this.db.getFirstAsync(`
    SELECT rp.*, s.title as story_title
    FROM reading_progress rp
    JOIN stories s ON rp.collection_id = s.collection_id
      AND rp.story_number = s.story_number
    ORDER BY rp.last_read DESC
    LIMIT 1
  `);
  return result as ReadingProgress | null;
}
```

## 4. ⬅️ Go Back to Story List in Frame View

**Current State**: Navigation from frame view back to story list may be missing.

**Solution**: Add proper navigation breadcrumbs and back button

**Implementation**:
```typescript
// Add to frame viewer component
const navigateToStoryList = () => {
  router.push(`/stories/${collectionId}`);
};

// Add header with back navigation
<View className="flex-row items-center p-4">
  <TouchableOpacity onPress={navigateToStoryList}>
    <MaterialIcons name="arrow-back" size={24} />
  </TouchableOpacity>
  <Text className="ml-2 text-lg font-semibold">
    {storyTitle} - Frame {frameNumber}
  </Text>
</View>
```

## 5. 📊 Add Status Bar for Each Story in Story List

**Current State**: Stories don't show reading progress or status.

**Solution**: Add progress indicators and status badges

**Implementation**:
```typescript
interface StoryWithProgress extends Story {
  progress: number; // 0-100
  isCompleted: boolean;
  lastReadFrame: number;
  isFavorite: boolean;
}

// Progress bar component
const ProgressBar = ({ progress }: { progress: number }) => (
  <View className="w-full h-2 bg-gray-200 rounded-full mt-2">
    <View
      className="h-full bg-blue-500 rounded-full"
      style={{ width: `${progress}%` }}
    />
  </View>
);

// Story item with status
const StoryItem = ({ story }: { story: StoryWithProgress }) => (
  <View className="p-4 border-b border-gray-200">
    <View className="flex-row justify-between items-start">
      <Text className="text-lg font-semibold flex-1">{story.title}</Text>
      <View className="flex-row items-center">
        {story.isFavorite && <MaterialIcons name="favorite" size={16} color="red" />}
        {story.isCompleted && <MaterialIcons name="check-circle" size={16} color="green" />}
      </View>
    </View>
    <Text className="text-sm text-gray-600 mt-1">
      {story.isCompleted ? 'Completed' : `Frame ${story.lastReadFrame} of ${story.frames.length}`}
    </Text>
    <ProgressBar progress={story.progress} />
  </View>
);
```

## 6. ❤️ Fix Favorite Feature

**Current State**: Favorites not showing properly in favorites screen.

**Issues Found**:
- Database queries may not be working correctly
- UI state not updating after favoriting

**Solution**: Fix database operations and state management

**Implementation**:
```typescript
// Fix in CollectionsManager.ts
async toggleStoryFavorite(collectionId: string, storyNumber: number): Promise<void> {
  if (!this.initialized) await this.initialize();

  const currentStory = await this.getStory(collectionId, storyNumber);
  if (!currentStory) throw new Error('Story not found');

  const newFavoriteStatus = !currentStory.isFavorite;

  await this.db.runAsync(
    'UPDATE stories SET is_favorite = ? WHERE collection_id = ? AND story_number = ?',
    [newFavoriteStatus ? 1 : 0, collectionId, storyNumber]
  );

  // Emit event for UI updates
  this.emitFavoriteChanged(collectionId, storyNumber, newFavoriteStatus);
}

// Add event emitter for real-time updates
private favoriteListeners: ((collectionId: string, storyNumber: number, isFavorite: boolean) => void)[] = [];

onFavoriteChanged(callback: (collectionId: string, storyNumber: number, isFavorite: boolean) => void) {
  this.favoriteListeners.push(callback);
}

private emitFavoriteChanged(collectionId: string, storyNumber: number, isFavorite: boolean) {
  this.favoriteListeners.forEach(callback => callback(collectionId, storyNumber, isFavorite));
}
```

## 7. ℹ️ Collection Info Icon with Actions

**Current State**: Collections don't have info/action buttons.

**Solution**: Add info modal with collection details and actions

**Implementation**:
```typescript
// Collection info modal component
const CollectionInfoModal = ({ collection, visible, onClose }: {
  collection: Collection;
  visible: boolean;
  onClose: () => void;
}) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold">Collection Info</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-lg font-semibold">{collection.displayName}</Text>
        <Text className="text-gray-600 mt-1">{collection.owner}</Text>

        <View className="mt-4">
          <Text className="font-semibold">Language: {collection.language}</Text>
          <Text className="font-semibold">Version: {collection.version}</Text>
          <Text className="font-semibold">Last Updated: {collection.lastUpdated.toLocaleDateString()}</Text>
        </View>

        {collection.metadata?.description && (
          <View className="mt-4">
            <Text className="font-semibold">Description:</Text>
            <Text className="mt-1">{collection.metadata.description}</Text>
          </View>
        )}

        <View className="mt-6 space-y-2">
          <TouchableOpacity className="bg-red-500 p-3 rounded-lg">
            <Text className="text-white text-center font-semibold">Delete Collection</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-blue-500 p-3 rounded-lg">
            <Text className="text-white text-center font-semibold">Export Collection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

// Add info button to collection items
<TouchableOpacity
  onPress={() => setShowInfo(true)}
  className="p-2"
>
  <MaterialIcons name="info" size={20} color="gray" />
</TouchableOpacity>
```

## 8. 🔍 Fix Search Feature

**Current State**: Search is using mock data and not searching actual content.

**Solution**: Implement full-text search across all downloaded content

**Implementation**:
```typescript
// Add to CollectionsManager.ts
async searchContent(query: string, collectionId?: string): Promise<SearchResult[]> {
  if (!this.initialized) await this.initialize();

  const searchQuery = `%${query.toLowerCase()}%`;
  const sql = `
    SELECT
      f.collection_id,
      f.story_number,
      f.frame_number,
      f.text,
      s.title as story_title,
      c.displayName as collection_name
    FROM frames f
    JOIN stories s ON f.collection_id = s.collection_id AND f.story_number = s.story_number
    JOIN collections c ON f.collection_id = c.id
    WHERE LOWER(f.text) LIKE ?
    ${collectionId ? 'AND f.collection_id = ?' : ''}
    ORDER BY f.collection_id, f.story_number, f.frame_number
    LIMIT 100
  `;

  const params = collectionId ? [searchQuery, collectionId] : [searchQuery];
  const results = await this.db.getAllAsync(sql, params);

  return results.map(row => ({
    id: `${row.collection_id}-${row.story_number}-${row.frame_number}`,
    collectionId: row.collection_id,
    collectionName: row.collection_name,
    storyNumber: row.story_number,
    storyTitle: row.story_title,
    frameNumber: row.frame_number,
    text: row.text,
    // Highlight matching text
    highlightedText: this.highlightSearchTerm(row.text, query)
  }));
}

private highlightSearchTerm(text: string, term: string): string {
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
```

## 9. 💬 Add Comments/Notes Feature

**Current State**: No commenting system exists.

**Solution**: Add frame-level commenting system

**Implementation**:
```typescript
// Add comments table
CREATE TABLE IF NOT EXISTS frame_comments (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  story_number INTEGER NOT NULL,
  frame_number INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (collection_id, story_number, frame_number)
    REFERENCES frames(collection_id, story_number, frame_number) ON DELETE CASCADE
);

// Comment interface
interface FrameComment {
  id: string;
  collectionId: string;
  storyNumber: number;
  frameNumber: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// Comments manager
class CommentsManager {
  async addComment(
    collectionId: string,
    storyNumber: number,
    frameNumber: number,
    comment: string
  ): Promise<string> {
    const id = `comment_${Date.now()}_${Math.random()}`;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO frame_comments
       (id, collection_id, story_number, frame_number, comment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, collectionId, storyNumber, frameNumber, comment, now, now]
    );

    return id;
  }

  async getFrameComments(
    collectionId: string,
    storyNumber: number,
    frameNumber: number
  ): Promise<FrameComment[]> {
    const results = await this.db.getAllAsync(
      `SELECT * FROM frame_comments
       WHERE collection_id = ? AND story_number = ? AND frame_number = ?
       ORDER BY created_at DESC`,
      [collectionId, storyNumber, frameNumber]
    );

    return results.map(row => ({
      id: row.id,
      collectionId: row.collection_id,
      storyNumber: row.story_number,
      frameNumber: row.frame_number,
      comment: row.comment,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }
}

// Comments UI component
const CommentsSection = ({ collectionId, storyNumber, frameNumber }: {
  collectionId: string;
  storyNumber: number;
  frameNumber: number;
}) => {
  const [comments, setComments] = useState<FrameComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const addComment = async () => {
    if (!newComment.trim()) return;

    const commentsManager = CommentsManager.getInstance();
    await commentsManager.addComment(collectionId, storyNumber, frameNumber, newComment);
    setNewComment('');

    // Reload comments
    const updatedComments = await commentsManager.getFrameComments(collectionId, storyNumber, frameNumber);
    setComments(updatedComments);
  };

  return (
    <View className="border-t border-gray-200 p-4">
      <TouchableOpacity
        onPress={() => setShowComments(!showComments)}
        className="flex-row items-center justify-between"
      >
        <Text className="font-semibold">Comments ({comments.length})</Text>
        <MaterialIcons
          name={showComments ? "expand-less" : "expand-more"}
          size={24}
        />
      </TouchableOpacity>

      {showComments && (
        <View className="mt-4">
          <View className="flex-row items-center space-x-2 mb-4">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg p-2"
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              onPress={addComment}
              className="bg-blue-500 p-2 rounded-lg"
            >
              <MaterialIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {comments.map(comment => (
            <View key={comment.id} className="bg-gray-50 p-3 rounded-lg mb-2">
              <Text>{comment.comment}</Text>
              <Text className="text-xs text-gray-500 mt-1">
                {comment.createdAt.toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
```

## 10. 📤 Export/Import Collections via Bluetooth/FileSystem

**Current State**: No export/import functionality.

**Solution**: Implement collection export/import with multiple sharing options

**Implementation**:
```typescript
// Add to package.json dependencies
"expo-sharing": "~12.0.1",
"expo-file-system": "~17.0.1",
"expo-document-picker": "~12.0.2",

// Export/Import manager
class CollectionSharingManager {
  async exportCollection(collectionId: string): Promise<string> {
    const collectionsManager = CollectionsManager.getInstance();

    // Get collection data
    const collection = await collectionsManager.getCollectionById(collectionId);
    const stories = await collectionsManager.getCollectionStories(collectionId);

    const exportData = {
      collection,
      stories: await Promise.all(
        stories.map(async story => ({
          ...story,
          frames: await collectionsManager.getStoryFrames(collectionId, story.storyNumber)
        }))
      ),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    // Create export file
    const fileName = `${collection.displayName.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

    return fileUri;
  }

  async shareCollection(collectionId: string): Promise<void> {
    const fileUri = await this.exportCollection(collectionId);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Share Collection'
      });
    }
  }

  async importCollection(): Promise<void> {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true
    });

    if (result.type === 'success') {
      const content = await FileSystem.readAsStringAsync(result.uri);
      const importData = JSON.parse(content);

      // Validate and import
      await this.processImportData(importData);
    }
  }

  private async processImportData(data: any): Promise<void> {
    // Validate data structure
    if (!data.collection || !data.stories) {
      throw new Error('Invalid export file format');
    }

    const collectionsManager = CollectionsManager.getInstance();

    // Import collection
    await collectionsManager.saveCollectionToDB(data.collection);

    // Import stories and frames
    for (const story of data.stories) {
      await collectionsManager.saveStoryToDB(story);

      for (const frame of story.frames) {
        await collectionsManager.saveFrameToDB(frame);
      }
    }
  }
}

// UI for export/import
const ExportImportButtons = ({ collectionId }: { collectionId: string }) => {
  const sharingManager = new CollectionSharingManager();

  return (
    <View className="flex-row space-x-2 p-4">
      <TouchableOpacity
        onPress={() => sharingManager.shareCollection(collectionId)}
        className="flex-1 bg-blue-500 p-3 rounded-lg"
      >
        <Text className="text-white text-center font-semibold">Export & Share</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => sharingManager.importCollection()}
        className="flex-1 bg-green-500 p-3 rounded-lg"
      >
        <Text className="text-white text-center font-semibold">Import Collection</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## 11. 🔄 Support RTL Text Direction

**Current State**: No RTL support implemented.

**Solution**: Add RTL detection and styling

**Implementation**:
```typescript
// Add RTL detection utility
const isRTL = (text: string): boolean => {
  const rtlChars = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/;
  return rtlChars.test(text);
};

// RTL-aware text component
const RTLText = ({ children, style, ...props }: TextProps & { children: string }) => {
  const textDirection = isRTL(children) ? 'rtl' : 'ltr';

  return (
    <Text
      style={[
        {
          textAlign: textDirection === 'rtl' ? 'right' : 'left',
          writingDirection: textDirection
        },
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

// Update frame text rendering
const FrameText = ({ text }: { text: string }) => (
  <RTLText className="text-lg leading-relaxed p-4">
    {text}
  </RTLText>
);

// Add RTL support to collection metadata
interface Collection {
  // ... existing fields
  metadata?: {
    // ... existing fields
    languageDetails?: {
      direction: 'ltr' | 'rtl';
      fontFamily?: string;
    };
  };
}
```

## 12. 🔤 Support Font Size Change

**Current State**: Fixed font sizes throughout the app.

**Solution**: Implement dynamic font sizing with user preferences

**Implementation**:
```typescript
// Font size settings
interface FontSettings {
  size: 'small' | 'medium' | 'large' | 'extra-large';
  scale: number;
}

const FONT_SCALES = {
  'small': 0.8,
  'medium': 1.0,
  'large': 1.2,
  'extra-large': 1.4
};

// Settings manager for font preferences
class FontSettingsManager {
  private static instance: FontSettingsManager;
  private currentSettings: FontSettings = { size: 'medium', scale: 1.0 };

  static getInstance(): FontSettingsManager {
    if (!FontSettingsManager.instance) {
      FontSettingsManager.instance = new FontSettingsManager();
    }
    return FontSettingsManager.instance;
  }

  async loadSettings(): Promise<FontSettings> {
    try {
      const stored = await AsyncStorage.getItem('fontSettings');
      if (stored) {
        this.currentSettings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading font settings:', error);
    }
    return this.currentSettings;
  }

  async updateFontSize(size: FontSettings['size']): Promise<void> {
    this.currentSettings = {
      size,
      scale: FONT_SCALES[size]
    };

    await AsyncStorage.setItem('fontSettings', JSON.stringify(this.currentSettings));
  }

  getCurrentScale(): number {
    return this.currentSettings.scale;
  }
}

// Scalable text component
const ScalableText = ({
  children,
  baseSize = 16,
  style,
  ...props
}: TextProps & {
  children: React.ReactNode;
  baseSize?: number;
}) => {
  const [fontScale, setFontScale] = useState(1.0);

  useEffect(() => {
    const loadFontScale = async () => {
      const fontManager = FontSettingsManager.getInstance();
      await fontManager.loadSettings();
      setFontScale(fontManager.getCurrentScale());
    };

    loadFontScale();
  }, []);

  return (
    <Text
      style={[
        { fontSize: baseSize * fontScale },
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

// Font size settings screen
const FontSizeSettings = () => {
  const [currentSize, setCurrentSize] = useState<FontSettings['size']>('medium');
  const fontManager = FontSettingsManager.getInstance();

  const updateFontSize = async (size: FontSettings['size']) => {
    setCurrentSize(size);
    await fontManager.updateFontSize(size);
  };

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-4">Font Size</Text>

      {Object.keys(FONT_SCALES).map((size) => (
        <TouchableOpacity
          key={size}
          onPress={() => updateFontSize(size as FontSettings['size'])}
          className={`p-4 mb-2 rounded-lg border ${
            currentSize === size ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <ScalableText baseSize={16}>
            {size.charAt(0).toUpperCase() + size.slice(1)} - Sample text
          </ScalableText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Update frame text with scalable text
const FrameTextScalable = ({ text }: { text: string }) => (
  <ScalableText baseSize={18} className="leading-relaxed p-4">
    {text}
  </ScalableText>
);
```

## Implementation Priority

1. **High Priority** (Core functionality):
   - Fix favorite feature (#6)
   - Fix search feature (#8)
   - Add delete collections (#1)
   - Show correct titles in continue reading (#3)

2. **Medium Priority** (User experience):
   - Add status bars for stories (#5)
   - Add collection info icons (#7)
   - Support font size changes (#12)
   - Add back navigation in frame view (#4)

3. **Low Priority** (Advanced features):
   - Store more metadata (#2)
   - Add comments/notes feature (#9)
   - Export/import collections (#10)
   - Support RTL text direction (#11)

## Next Steps

1. Start with fixing the favorites and search features as they are core functionality
2. Implement the delete collections feature for better user control
3. Add progress tracking and status indicators
4. Gradually add the advanced features based on user feedback

Each solution includes the necessary code changes, database schema updates, and UI components needed for implementation.
