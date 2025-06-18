import JSZip from 'jszip';

import { warn } from './utils';

/**
 * Shared utilities for ZIP processing and optimized database operations
 * Used by both CollectionsManager and CollectionImportExportManager
 */

export interface ProcessedStoryData {
  collection_id: string;
  story_number: number;
  title: string;
  is_favorite: boolean;
  metadata?: Record<string, any>;
}

export interface ProcessedFrameData {
  collection_id: string;
  story_number: number;
  frame_number: number;
  image_url: string;
  text: string;
  is_favorite: boolean;
  metadata?: Record<string, any>;
}

export interface ZipProcessingResult {
  stories: ProcessedStoryData[];
  frames: ProcessedFrameData[];
}

/**
 * Extract source reference from story content
 */
export function extractSourceReference(content: string): {
  sourceReference: string | null;
  cleanedContent: string;
} {
  const lines = content.split('\n');
  let sourceReference: string | null = null;
  let lastNonBlankLineIndex = -1;

  // Find the last non-blank line
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line) {
      lastNonBlankLineIndex = i;
      // Check if the line contains text between underscores
      const sourceReferenceMatch = line.match(/_([^_]+)_/);
      if (sourceReferenceMatch) {
        sourceReference = sourceReferenceMatch[1].trim();
      }
      break; // Stop at the first non-blank line from the end
    }
  }

  // If we found a source reference, remove that line from the content
  let cleanedContent = content;
  if (sourceReference !== null && lastNonBlankLineIndex >= 0) {
    const modifiedLines = [...lines];
    modifiedLines[lastNonBlankLineIndex] = ''; // Remove the line with source reference
    cleanedContent = modifiedLines.join('\n').trim();
  }

  return { sourceReference, cleanedContent };
}

/**
 * Process ZIP file contents and extract stories and frames data
 * This is the optimized version that collects all data first before database operations
 */
export async function processZipContents(
  zip: JSZip,
  collectionId: string,
  onProgress?: (processed: number, total: number, status: string) => void
): Promise<ZipProcessingResult> {
  const allStories: ProcessedStoryData[] = [];
  const allFrames: ProcessedFrameData[] = [];

  // Updated regex to match both content/ and ingredients/ directories
  const storyFileRegex = /(?:^|\/)(?:content\/|ingredients\/)?(\d+)\.md$/i;
  const frameParseRegex = /!\[[^\]]*?\]\(([^)]+?)\)\s*([\s\S]*?)(?=(?:!\[[^\]]*?\]\([^)]+?\))|$)/g;

  const filesToProcess = Object.entries(zip.files).filter(([_, zipEntry]) => !zipEntry.dir);
  let processedFiles = 0;

  for (const [fullPath, zipEntry] of filesToProcess) {
    const content = await zipEntry.async('string');
    const storyMatch = fullPath.match(storyFileRegex);

    if (storyMatch) {
      const storyNumber = parseInt(storyMatch[1], 10);
      if (isNaN(storyNumber)) {
        warn(`Skipping file with invalid story number: ${fullPath}`);
        continue;
      }

      // Extract title from content
      let titleFromContent = '';
      const contentLines = content.split('\n');
      if (contentLines.length > 0) {
        const firstLine = contentLines[0].trim();
        if (firstLine.startsWith('# ')) {
          titleFromContent = firstLine.substring(2).trim();
        }
      }

      const title = titleFromContent || `Story ${storyNumber}`;

      // Extract source reference from the content
      const { sourceReference, cleanedContent } = extractSourceReference(content);

      // Prepare story metadata
      const storyMetadata: Record<string, any> = {};
      if (sourceReference) {
        storyMetadata.sourceReference = sourceReference;
      }

      // Collect story data
      allStories.push({
        collection_id: collectionId,
        story_number: storyNumber,
        title,
        is_favorite: false,
        metadata: Object.keys(storyMetadata).length > 0 ? storyMetadata : undefined,
      });

      // Process frames for this story
      let frameNumber = 0;
      let match;
      frameParseRegex.lastIndex = 0;
      while ((match = frameParseRegex.exec(cleanedContent)) !== null) {
        frameNumber++;
        const imageUrl = match[1].trim();
        const frameText = match[2].trim();
        if (!imageUrl || !frameText) {
          warn(`Skipping empty frame ${frameNumber} in story ${storyNumber} of ${collectionId}`);
          continue;
        }

        // Collect frame data
        allFrames.push({
          collection_id: collectionId,
          story_number: storyNumber,
          frame_number: frameNumber,
          image_url: imageUrl,
          text: frameText,
          is_favorite: false,
          metadata: {},
        });
      }
    }

    processedFiles++;
    onProgress?.(
      processedFiles,
      filesToProcess.length,
      `Processed ${processedFiles} of ${filesToProcess.length} files`
    );
  }

  return { stories: allStories, frames: allFrames };
}

/**
 * Batch save stories for better performance using bulk inserts
 */
export async function batchSaveStories(stories: ProcessedStoryData[]): Promise<void> {
  if (stories.length === 0) return;

  // Use optimized bulk inserts
  const database = (await import('@/db/database')).default;
  const { sql } = await import('drizzle-orm');
  const { stories: storiesTable } = await import('@/db/schema');

  await database.transaction(async (tx) => {
    const batchSize = 200; // Larger batch size for stories

    for (let i = 0; i < stories.length; i += batchSize) {
      const batch = stories.slice(i, i + batchSize);

      // Use Drizzle's bulk insert
      const insertValues = batch.map((story) => ({
        collection_id: story.collection_id,
        story_number: story.story_number,
        title: story.title,
        is_favorite: story.is_favorite,
        metadata: story.metadata || {},
      }));

      await tx
        .insert(storiesTable)
        .values(insertValues)
        .onConflictDoUpdate({
          target: [storiesTable.collection_id, storiesTable.story_number],
          set: {
            title: sql`excluded.title`,
            is_favorite: sql`excluded.is_favorite`,
            metadata: sql`excluded.metadata`,
          },
        });
    }
  });
}

/**
 * Batch save frames for better performance using optimized batching
 */
export async function batchSaveFrames(
  frames: ProcessedFrameData[],
  onProgress?: (progress: number) => void
): Promise<void> {
  if (frames.length === 0) return;

  // Use optimized batching with larger batch sizes
  const database = (await import('@/db/database')).default;
  const { sql } = await import('drizzle-orm');
  const { frames: framesTable } = await import('@/db/schema');

  await database.transaction(async (tx) => {
    const batchSize = 500; // Much larger batch size
    const totalBatches = Math.ceil(frames.length / batchSize);

    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;

      // Use Drizzle's bulk insert
      const insertValues = batch.map((frame) => ({
        collection_id: frame.collection_id,
        story_number: frame.story_number,
        frame_number: frame.frame_number,
        image_url: frame.image_url,
        text: frame.text,
        is_favorite: frame.is_favorite,
        metadata: frame.metadata || {},
      }));

      await tx
        .insert(framesTable)
        .values(insertValues)
        .onConflictDoUpdate({
          target: [framesTable.collection_id, framesTable.story_number, framesTable.frame_number],
          set: {
            image_url: sql`excluded.image_url`,
            text: sql`excluded.text`,
            is_favorite: sql`excluded.is_favorite`,
            metadata: sql`excluded.metadata`,
          },
        });

      // Report progress
      onProgress?.((currentBatch / totalBatches) * 100);
    }
  });
}

/**
 * Load ZIP file from different sources (ArrayBuffer, base64 string)
 */
export async function loadZipFile(
  source: ArrayBuffer | string,
  options: { isBase64?: boolean } = {}
): Promise<JSZip> {
  const zip = new JSZip();

  if (typeof source === 'string' && options.isBase64) {
    return await zip.loadAsync(source, {
      base64: true,
      createFolders: false, // Don't create folder objects, saves memory
    });
  } else {
    return await zip.loadAsync(source, {
      createFolders: false, // Don't create folder objects, saves memory
    });
  }
}

/**
 * Complete optimized ZIP processing workflow
 * This combines loading, processing, and saving in an optimized way
 */
export async function processAndStoreZipOptimized(
  zipSource: ArrayBuffer | string,
  collectionId: string,
  options: {
    isBase64?: boolean;
    onProgress?: (stage: string, progress: number, status: string) => void;
  } = {}
): Promise<void> {
  const { isBase64 = false, onProgress } = options;

  try {
    onProgress?.('loading', 0, 'Loading ZIP file...');

    // Load ZIP file
    const zip = await loadZipFile(zipSource, { isBase64 });

    onProgress?.('processing', 10, 'Processing ZIP contents...');

    // Process ZIP contents and collect all data
    const { stories, frames } = await processZipContents(
      zip,
      collectionId,
      (processed, total, status) => {
        const progress = 10 + Math.floor((processed / total) * 60);
        onProgress?.('processing', progress, status);
      }
    );

    onProgress?.('saving', 70, 'Saving stories to database...');

    // Batch save stories
    await batchSaveStories(stories);

    onProgress?.('saving', 80, 'Saving frames to database...');

    // Batch save frames with progress reporting
    await batchSaveFrames(frames, (frameProgress) => {
      const progress = 80 + Math.floor(frameProgress * 0.15);
      onProgress?.('saving', progress, `Saving frames... ${Math.round(frameProgress)}%`);
    });

    onProgress?.('complete', 100, 'ZIP processing complete!');

    warn(
      `Successfully processed and stored ${stories.length} stories and ${frames.length} frames for collection ${collectionId}`
    );
  } catch (error) {
    warn(
      `Error in optimized ZIP processing for ${collectionId}: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}
