/**
 * Application types
 */

export interface Story {
  id: string;
  title: string;
  description: string;
  language: string;
  frames: StoryFrame[];
  reference?: string;
  introduction?: string;
}

export interface StoryFrame {
  id: string;
  number: number;
  text: string;
  image: {
    id: string;
    url: string;
    resolutions: {
      low: string;
      medium: string;
      high: string;
    };
  };
}

export interface LanguageItem {
  alt: string[]; // alternative names
  ang: string; // language name
  cc: string[]; // country codes
  gw: boolean; // is a gateway language
  hc: string; // country code
  lc: string; // language code
  ld: string; // ltr or rtl
  ln: string; // language name
  lr: string; // Africa, Asia, Europe, North America, South America, Oceania, Antarctica
  pk: number; // population
}

export interface Language {
  id?: string;
  code: string;
  name: string;
  downloaded?: boolean;
  owner?: string;
}

export interface DownloadProgress {
  storyId: string;
  language: string;
  progress: number;
  completed: boolean;
  error?: string;
}

export interface AppSettings {
  darkMode: boolean;
  autoDownload: boolean;
  highQualityImages: boolean;
  defaultLanguage: string;
}

// Types for the OBS data structures
export interface StoriesData {
  stories: Record<string, ProcessedStory>;
  version: string;
  language: string;
  targetAudience?: 'children' | 'adults' | 'bible-study';
  imagePack?: {
    id: string;
    version: string;
    url: string;
  };
}

export interface ProcessedStory {
  id: string;
  number: number;
  title: string;
  introduction: string;
  frames: StoryFrame[];
  reference: string;
}

export interface Reference {
  story: number;
  frame: number;
}

// Bookmark types
export interface Bookmark {
  id: string;
  storyId: number;
  frameId: number;
  note?: string;
  dateCreated: string;
}

// Context types
export interface OBSState {
  reference: Reference;
  OBS: StoriesData | null;
  language: Language;
  bookmarks: Bookmark[];
}

export interface OBSContextType {
  OBSState: OBSState;
  setOBState: React.Dispatch<OBSAction>;
}

// Action types for the reducer
export type OBSAction =
  | { type: 'GO_NEXT' }
  | { type: 'GO_PREV' }
  | { type: 'NAV_TO'; payload: { story: number; frame?: number } }
  | { type: 'SET_OBS'; payload: StoriesData }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'ADD_BOOKMARK'; payload: Bookmark }
  | { type: 'REMOVE_BOOKMARK'; payload: string }
  | { type: 'UPDATE_BOOKMARK'; payload: Bookmark }
  | { type: 'ADD_BOOKMARKS'; payload: Bookmark[] };
