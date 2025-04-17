export interface ProcessedStory {
  id: string;
  number: number;
  title: string;
  introduction: string;
  frames: StoryFrame[];
  reference: string;
}

export interface StoryFrame {
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

export interface StoryIndex {
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

export interface ImageSet {
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

// Export StoriesData from index.ts
export type { StoriesData } from './types/index';
