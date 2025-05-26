export interface Repository {
  id: string;
  owner: string;
  language: string;
  displayName: string;
  description?: string;
  version: string;
  lastUpdated: Date;
  targetAudience?: 'children' | 'adults' | 'bible-study';
  imagePack?: {
    id: string;
    version: string;
    url: string;
  };
  isDownloaded?: boolean;
  thumbnail?: string;
  localThumbnail?: string | null;
}
