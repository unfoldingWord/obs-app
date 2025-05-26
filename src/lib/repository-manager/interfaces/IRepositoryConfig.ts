export interface IRepositoryConfig {
  baseUrl: string;
  storageKey: string;
  thumbnailsDir: string;
  appDir: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export const DEFAULT_CONFIG: IRepositoryConfig = {
  baseUrl: 'https://git.door43.org/api/v1',
  storageKey: '@obs_downloaded_repos',
  thumbnailsDir: 'thumbnails',
  appDir: 'obs-app',
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
};
