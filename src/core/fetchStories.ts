import JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';
import { parse } from 'yaml';

import { warn } from './utils';
import { StoriesData, ProcessedStory, StoryFrame } from '../types';

/**
 * Main function to fetch stories from a Git repository
 * @param owner Repository owner
 * @param languageCode Language code for the stories
 * @returns Promise with the stories data
 */
export const fetchStories = async (owner: string, languageCode: string): Promise<StoriesData> => {
  try {
    console.log('Loading stories from internet');

    // Step 1: Get latest release info
    const latestRelease = await getLatestRelease(owner, languageCode);
    if (!latestRelease) {
      throw new Error('No release found for the specified language and owner');
    }

    // Step 2: Get version from manifest
    const latestVersion = await getLatestVersion(owner, languageCode, latestRelease['tag_name']);

    // Step 3: Prepare result structure
    const result: StoriesData = {
      stories: {},
      version: latestVersion || '1.0.0',
      language: languageCode,
    };

    // Step 4: Download and extract zip file
    const storiesUrl = latestRelease['zipball_url'];
    const extractedFiles = await downloadAndExtractZip(storiesUrl);

    // Step 5: Process story files
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
    warn(`Error downloading/extracting zip: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error('Failed to download or extract zip files');
  }
};

/**
 * Process story files from extracted zip
 */
const processStoryFiles = async (files: Record<string, any> | null, result: StoriesData): Promise<void> => {
  if (!files) {
    throw new Error('No files to process');
  }

  for (const fileName in files) {
    if (isStoryFile(fileName)) {
      const storyNumber = extractStoryNumber(fileName);
      const fileContent = await files[fileName].async('string');
      result.stories[storyNumber] = parseStoryContent(fileContent);
    }
  }
};

/**
 * Checks if a file is a story content file
 */
const isStoryFile = (fileName: string): boolean => {
  return !!fileName.match(/\/content\/\d/gm);
};

/**
 * Extracts the story number from a file name
 */
const extractStoryNumber = (fileName: string): string => {
  return fileName.slice(-5, -3);
};

/**
 * Gets the latest release from the repository
 * @param owner Repository owner
 * @param languageCode Language code
 * @returns Promise with release data
 */
export const getLatestRelease = async (owner: string, languageCode: string): Promise<any> => {
  const url = `https://git.door43.org/api/v1/repos/${owner}/${languageCode}_obs/releases/latest`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch latest release: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    warn(`Error getting latest release: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

/**
 * Gets the latest version from the manifest
 * @param owner Repository owner
 * @param languageCode Language code
 * @param tagName Release tag name
 * @returns Promise with the version string
 */
export const getLatestVersion = async (
  owner: string,
  languageCode: string,
  tagName: string
): Promise<string> => {
  const url = `https://git.door43.org/api/v1/repos/${owner}/${languageCode}_obs/raw/manifest.yaml?ref=${tagName}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
    }

    const latestManifest = await response.text();
    return getVersionFromYamlManifest(latestManifest) || '1.0.0';
  } catch (error) {
    warn(`Error getting latest version: ${error instanceof Error ? error.message : String(error)}`);
    return '1.0.0';
  }
};

/**
 * Extracts version from YAML manifest
 * @param yaml YAML manifest content
 * @returns Version string
 */
const getVersionFromYamlManifest = (yaml: string): string | null => {
  try {
    const manifest = parse(yaml);
    return manifest['dublin_core']?.version || null;
  } catch (error) {
    warn(`Error parsing manifest: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

/**
 * Parses a story from its string content
 * @param obsString Story content in string format
 * @returns Structured story object
 */
const parseStoryContent = (obsString: string): ProcessedStory => {
  const lines = obsString.split('\n');
  const { title, number, id } = extractStoryInfo(lines[0]);

  let introduction = '';
  const frames: StoryFrame[] = [];
  let currentFrame: Partial<StoryFrame> = {};
  let reference = '';

  // Process each line of the story
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (isFrameHeader(line)) {
      if (currentFrame.text) {
        frames.push(currentFrame as StoryFrame);
      }
      currentFrame = createEmptyFrame(frames.length + 1);
    } else if (isImageLine(line)) {
      currentFrame.image = extractImageInfo(line);
    } else if (isReferenceFooter(line)) {
      reference = extractReference(line);
    } else if (!currentFrame.text) {
      introduction += line + '\n';
    } else {
      currentFrame.text += line + '\n';
    }
  }

  // Add the last frame if it exists
  if (currentFrame.text) {
    frames.push(currentFrame as StoryFrame);
  }

  return {
    id,
    number,
    title,
    introduction: introduction.trim(),
    frames,
    reference,
  };
};

/**
 * Extract story info from the title line
 */
const extractStoryInfo = (titleLine: string) => {
  const title = titleLine.replace('#', '').trim();
  const number = parseInt(title.split('.')[0]);
  const id = String(number).padStart(2, '0');
  const titleText = title.split('.')[1]?.trim() || '';

  return { title: titleText, number, id };
};

/**
 * Create an empty frame structure
 */
const createEmptyFrame = (frameNumber: number): Partial<StoryFrame> => ({
  id: String(frameNumber).padStart(2, '0'),
  number: frameNumber,
  text: '',
  image: {
    url: '',
    resolutions: {
      low: '',
      medium: '',
      high: '',
    },
  },
});

/**
 * Checks if a line is a frame header
 */
const isFrameHeader = (line: string): boolean => line.startsWith('## Frame');

/**
 * Checks if a line contains an image
 */
const isImageLine = (line: string): boolean => line.startsWith('![OBS Image]');

/**
 * Checks if a line is the reference footer
 */
const isReferenceFooter = (line: string): boolean => line.startsWith('_A Bible story from:');

/**
 * Extract image information from an image line
 */
const extractImageInfo = (line: string) => {
  const imageUrl = line.match(/\((.*?)\)/)?.[1] || '';
  const resolutions = {
    low: imageUrl.replace('360px', '360px'),
    medium: imageUrl.replace('360px', '720px'),
    high: imageUrl.replace('360px', '1080px'),
  };

  return {
    url: imageUrl,
    resolutions,
  };
};

/**
 * Extract the reference from a reference line
 */
const extractReference = (line: string): string => {
  return line.replace(/[_*]/g, '').trim();
};
