import JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';

import { warn } from './utils';
import { StoriesData, ProcessedStory } from '../types/index';

/**
 * Main function to fetch stories from a Git repository
 * @param owner Repository owner
 * @param languageCode Language code for the stories
 * @returns Promise with the stories data
 */
export const fetchStories = async (owner: string, languageCode: string): Promise<StoriesData> => {
  try {
    console.log('Loading stories from internet');

    // Step 1: Get repository details
    const repository = await getRepositoryDetails(owner, languageCode);
    if (!repository) {
      throw new Error('Repository not found');
    }

    // Step 2: Prepare result structure
    const result: StoriesData = {
      stories: {},
      version: repository.version,
      language: languageCode,
      targetAudience: repository.targetAudience,
      imagePack: repository.imagePack,
    };

    // Step 3: Download and extract zip file
    const storiesUrl = `https://git.door43.org/api/v1/repos/${owner}/${languageCode}_obs/archive/zipball`;
    const extractedFiles = await downloadAndExtractZip(storiesUrl);

    // Step 4: Process story files
    await processStoryFiles(extractedFiles, result);

    return result;
  } catch (error) {
    warn(`Error fetching stories: ${error instanceof Error ? error.message : String(error)}`);
    return createEmptyStoriesData(languageCode);
  }
};

/**
 * Creates a minimal valid stories data object
 */
const createEmptyStoriesData = (languageCode: string): StoriesData => ({
  stories: {},
  version: '0.0.0',
  language: languageCode,
});

/**
 * Downloads and extracts a zip file
 * @param url URL to the zip file
 * @returns Promise with the extracted files
 */
const downloadAndExtractZip = async (url: string): Promise<Record<string, any> | null> => {
  try {
    const data = await JSZipUtils.getBinaryContent(url);
    const zip = new JSZip();
    await zip.loadAsync(data);
    return zip.files;
  } catch (error) {
    warn(
      `Error downloading/extracting zip: ${error instanceof Error ? error.message : String(error)}`
    );
    throw new Error('Failed to download or extract zip files');
  }
};

/**
 * Process story files from extracted zip
 */
const processStoryFiles = async (
  files: Record<string, any> | null,
  result: StoriesData
): Promise<void> => {
  if (!files) {
    throw new Error('No files to process');
  }

  // Process metadata first
  const metadataFile = Object.keys(files).find((file) => file.endsWith('metadata.json'));
  if (metadataFile) {
    const metadataContent = await files[metadataFile].async('string');
    const metadata = JSON.parse(metadataContent) as {
      version: string;
      targetAudience?: 'children' | 'adults' | 'bible-study';
      imagePack?: {
        id: string;
        version: string;
        url: string;
      };
    };
    result.version = metadata.version;
    result.targetAudience = metadata.targetAudience;
    result.imagePack = metadata.imagePack;
  }

  // Process stories
  for (const fileName in files) {
    if (isStoryFile(fileName)) {
      const storyId = extractStoryId(fileName);
      const fileContent = await files[fileName].async('string');
      result.stories[storyId] = parseStoryContent(fileContent);
    }
  }
};

/**
 * Checks if a file is a story content file
 */
const isStoryFile = (fileName: string): boolean => {
  return fileName.includes('/stories/') && fileName.endsWith('content.json');
};

/**
 * Extracts the story ID from a file name
 */
const extractStoryId = (fileName: string): string => {
  const match = fileName.match(/\/stories\/([^/]+)\/content\.json$/);
  return match ? match[1] : '';
};

/**
 * Gets repository details from catalog
 */
const getRepositoryDetails = async (owner: string, languageCode: string): Promise<any> => {
  const params = new URLSearchParams({
    subject: 'Open Bible Stories',
    lang: languageCode,
    owner,
    stage: 'prod',
  });

  try {
    const response = await fetch(`https://git.door43.org/api/v1/catalog/search?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to get repository details: ${response.status}`);
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    warn(
      `Error getting repository details: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
};

/**
 * Parses a story from its JSON content
 */
const parseStoryContent = (content: string): ProcessedStory => {
  const story = JSON.parse(content);
  return {
    id: story.id,
    number: story.number,
    title: story.title,
    introduction: story.introduction,
    frames: story.frames.map((frame: any) => ({
      id: frame.id,
      number: frame.number,
      text: frame.text,
      image: {
        id: frame.imageId,
        url: '', // Will be populated by image manager
        resolutions: {
          low: '',
          medium: '',
          high: '',
        },
      },
    })),
    reference: story.metadata.bibleReference,
  };
};
