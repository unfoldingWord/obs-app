import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';

import { CatalogEntry } from './catalogTypes';
import { StoryManager } from './storyManager';
import { warn } from './utils';

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

export class RepositoryManager {
  private static instance: RepositoryManager;
  private repositories: Map<string, Repository> = new Map();
  private static DOWNLOADS_STORAGE_KEY = '@obs_downloaded_repos';
  private static THUMBNAILS_DIR = 'thumbnails';
  private downloadedRepos: Set<string> = new Set();
  private initialized: boolean = false;

  private constructor() {}

  static async getInstance(): Promise<RepositoryManager> {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager();
      await RepositoryManager.instance.initialize();
    }
    return RepositoryManager.instance;
  }

  private async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.loadDownloadedRepos();
      this.initialized = true;
    }
  }

  private async loadDownloadedRepos(): Promise<void> {
    try {
      const downloads = await AsyncStorage.getItem(RepositoryManager.DOWNLOADS_STORAGE_KEY);
      if (downloads) {
        const downloadedArray = JSON.parse(downloads) as string[];
        this.downloadedRepos = new Set(downloadedArray);
        console.log('Loaded downloaded repos:', downloadedArray);
      }
    } catch (error) {
      warn(
        `Error loading downloaded repositories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getDownloadedRepos(): { owner: string; language: string; repositoryId: string }[] {
    const downloadedReposKeys = Array.from(this.downloadedRepos);
    const downloadedReposObj = downloadedReposKeys.map((key) => {
      const [owner, language, repositoryId] = key.split('/');
      return { owner, language, repositoryId };
    });
    return downloadedReposObj;
  }

  private getRepositoryKey(owner: string, language: string, repositoryId: string): string {
    return `${owner}/${language}/${repositoryId}`;
  }

  isRepositoryDownloaded(owner: string, language: string, repositoryId: string): boolean {
    const key = this.getRepositoryKey(owner, language, repositoryId);
    return this.downloadedRepos.has(key);
  }

  /**
   * Get the local path for a repository's thumbnail
   */
  private getThumbnailLocalPath(owner: string, language: string, id: string): string {
    return `${FileSystem.documentDirectory}obs-app/${RepositoryManager.THUMBNAILS_DIR}/${owner}_${language}_${id}.jpg`;
  }

  /**
   * Download and save a thumbnail image to local storage
   */
  private async downloadThumbnail(thumbnailUrl: string, localPath: string): Promise<string | null> {
    try {
      // Ensure the thumbnails directory exists
      const thumbnailsDir = `${FileSystem.documentDirectory}obs-app/${RepositoryManager.THUMBNAILS_DIR}`;
      await this.ensureDirectoryExists(thumbnailsDir);

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(thumbnailUrl, localPath);

      if (downloadResult.status === 200) {
        return localPath;
      } else {
        warn(`Error downloading thumbnail: HTTP status ${downloadResult.status}`);
        return null;
      }
    } catch (error) {
      warn(
        `Error downloading thumbnail: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  /**
   * Check if the device is currently connected to the internet
   * @returns Promise<boolean> True if connected, false otherwise
   */
  private async isOnline(): Promise<boolean> {
    try {
      // Create a timeout of 5 seconds
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 5000);
      });

      // The actual fetch request
      const fetchPromise = fetch('https://git.door43.org/api/v1/version', {
        method: 'HEAD',
      });

      // Race between timeout and fetch
      const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response;
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a repository by owner, language, and ID.
   * First checks local storage, then falls back to network if online.
   * @param owner Repository owner
   * @param language Repository language
   * @param repositoryId Repository ID
   * @returns Promise<Repository | null> The repository if found, null otherwise
   */
  async getRepository(
    owner: string,
    language: string,
    repositoryId: string
  ): Promise<Repository | null> {
    const key = this.getRepositoryKey(owner, language, repositoryId);

    // Check if repository exists in cache
    if (this.repositories.has(key)) {
      const repo = this.repositories.get(key);
      if (repo) {
        // Set the downloaded status
        repo.isDownloaded = this.isRepositoryDownloaded(owner, language, repositoryId);
        return repo;
      }
    }

    // If downloaded, try to load from local storage first
    if (this.isRepositoryDownloaded(owner, language, repositoryId)) {
      try {
        // Use the new getLocalRepository method which includes validation and repair
        const localRepo = await this.getLocalRepository(owner, language, repositoryId);
        if (localRepo) {
          return localRepo;
        }
      } catch (error) {
        warn(`Error loading repository from local storage: ${formatError(error)}`);
        // Continue to try loading from network
      }
    }

    // Check if we're online before making network requests
    const online = await this.isOnline();
    if (!online) {
      warn('Device is offline and repository not found in local cache');
      return null;
    }

    try {
      // Search for repository using catalog endpoint
      const params = new URLSearchParams({
        subject: 'Open Bible Stories',
        stage: 'prod',
      });

      // Add search parameters
      if (owner) params.append('owner', owner);
      if (language) params.append('lang', language);

      console.log(
        `Searching for repository with owner=${owner}, language=${language}, id=${repositoryId}`
      );
      const response = await fetch(`https://git.door43.org/api/v1/catalog/search?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to search repository: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.data || !data.data.length) {
        console.log('No repositories found in search results');
        return null;
      }

      console.log(`Found ${data.data.length} repositories, filtering for id=${repositoryId}`);

      // If repository ID is provided, find that specific repo
      let repoData;
      if (repositoryId) {
        // Find the specific repository by ID
        repoData = data.data.find((r: any) => r.name === repositoryId);
        if (!repoData) {
          console.log(`Repository with id=${repositoryId} not found in results`);
          return null;
        }
      } else {
        // Otherwise just take the first one
        repoData = data.data[0];
      }

      console.log(`Selected repository: ${repoData.name}`);

      const isDownloaded = this.isRepositoryDownloaded(owner, language, repositoryId);
      const thumbnailUrl =
        repoData.repo?.avatar_url ||
        `https://cdn.door43.org/obs/jpg/360px/obs-en-${Math.floor(Math.random() * 50)}-01.jpg`;

      // Check if we have a locally saved thumbnail
      let localThumbnail = null;
      if (isDownloaded) {
        const localPath = this.getThumbnailLocalPath(owner, language, repoData.name);
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          localThumbnail = localPath;
        }
      }

      const repository: Repository = {
        id: repoData.name,
        owner: repoData.owner || owner,
        language: repoData.language || language,
        displayName: repoData.title || repoData.name,
        description: repoData.repo?.description,
        version: repoData.release?.tag_name || '1.0.0',
        lastUpdated: new Date(repoData.release?.published_at || Date.now()),
        targetAudience: undefined,
        imagePack: undefined,
        thumbnail: thumbnailUrl,
        localThumbnail,
        isDownloaded,
      };

      this.repositories.set(key, repository);
      return repository;
    } catch (error) {
      console.error(
        `Error getting repository: ${error instanceof Error ? error.message : String(error)}`
      );
      warn(`Error getting repository: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async getZipFiles(url: string): Promise<Record<string, any> | null> {
    try {
      const data = await JSZipUtils.getBinaryContent(url);
      const zip = new JSZip();
      await zip.loadAsync(data);
      console.log('zip.files', zip.files);
      return zip.files;
    } catch (error) {
      warn(`Error getting zip files: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async downloadRepository(
    owner: string,
    language: string,
    repositoryId: string,
    version: string = 'master'
  ): Promise<void> {
    try {
      // Get repository details, specifically including the repository ID
      const repo = await this.getRepository(owner, language, repositoryId);
      if (!repo) {
        console.error(
          `Repository not found: owner=${owner}, language=${language}, id=${repositoryId}`
        );
        throw new Error('Repository not found');
      }

      console.log('repo', repo);

      // Use the catalogGetEntry endpoint to get specific repository info
      // Endpoint format: /api/v1/catalog/entry/{owner}/{repo}
      const entryUrl = `https://git.door43.org/api/v1/catalog/entry/${owner}/${repositoryId}/${version}`;
      console.log(`Fetching repository entry from: ${entryUrl}`);

      const entryResponse = await fetch(entryUrl);
      if (!entryResponse.ok) {
        throw new Error(`Failed to get repository entry: ${entryResponse.status}`);
      }

      const entryData: CatalogEntry = await entryResponse.json();
      console.log('Repository entry data:', entryData);

      // Get the zipball URL directly from the entry response
      let zipballUrl;
      if (entryData?.zipball_url) {
        zipballUrl = entryData.zipball_url;
      } else {
        // Fallback URL as last resort
        zipballUrl = `https://git.door43.org/${owner}/${repositoryId}/archive/${version}.zip`;
      }

      console.log(`Downloading from: ${zipballUrl}`);
      const downloadResponse = await fetch(zipballUrl);
      console.log(`Response: ${downloadResponse.status}`);

      if (!downloadResponse.ok) {
        throw new Error(`Failed to download repository: ${downloadResponse.status}`);
      }
      console.log('Downloaded response:', downloadResponse);

      const zipFiles = await this.getZipFiles(zipballUrl);
      console.log('Downloaded zip files:', zipFiles);

      // Get ZIP data as array buffer directly
      // This avoids the blob.arrayBuffer() issue
      const zipData = await downloadResponse.arrayBuffer();
      if (!zipData) {
        throw new Error('Failed to get ZIP data: response data is empty');
      }
      console.log(`Downloaded ZIP data size: ${zipData.byteLength} bytes`);

      // Process and store the ZIP file
      await this.processAndStoreZip(owner, language, zipData, repositoryId);

      // Process the stories from the repository
      const storyManager = StoryManager.getInstance();
      await storyManager.processRepositoryStories(repositoryId, owner, language);

      // Download and save the thumbnail
      if (repo.thumbnail) {
        const localThumbnailPath = this.getThumbnailLocalPath(owner, language, repo.id);
        const downloadedThumbnail = await this.downloadThumbnail(
          repo.thumbnail,
          localThumbnailPath
        );

        // Update the repository cache with the local thumbnail path
        if (
          downloadedThumbnail &&
          this.repositories.has(this.getRepositoryKey(owner, language, repositoryId))
        ) {
          const cachedRepo = this.repositories.get(
            this.getRepositoryKey(owner, language, repositoryId)
          );
          if (cachedRepo) {
            cachedRepo.localThumbnail = downloadedThumbnail;
          }
        }
      }

      // Mark repository as downloaded
      const key = this.getRepositoryKey(owner, language, repositoryId);
      this.downloadedRepos.add(key);
      await this.saveDownloadedRepos();

      // Update repository in cache
      if (this.repositories.has(key)) {
        const cachedRepo = this.repositories.get(key);
        if (cachedRepo) {
          cachedRepo.isDownloaded = true;
          this.repositories.set(key, cachedRepo);
        }
      }

      console.log(`Downloaded repository: ${repo.displayName}`);
    } catch (error) {
      console.error(`Download error: ${error instanceof Error ? error.message : String(error)}`);
      warn(
        `Error downloading repository: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Build a Repository object from catalog data
   */
  private buildRepositoryObject(
    result: CatalogEntry,
    owner: string,
    language: string,
    thumbnailUrl: string,
    localThumbnail: string | null = null
  ): Repository {
    const isDownloaded = this.isRepositoryDownloaded(owner, language, result.name);

    return {
      id: result.name,
      owner: result.owner || owner,
      language: result.language || language,
      displayName: result.title || result.name,
      description: result.repo?.description,
      version: result.release?.tag_name || '1.0.0',
      lastUpdated: new Date(result.release?.published_at || Date.now()),
      targetAudience: undefined, // Will be properly populated if available
      imagePack: undefined, // Will be properly populated if available
      thumbnail: thumbnailUrl,
      localThumbnail,
      isDownloaded,
    };
  }

  /**
   * Search for repositories matching the given language
   * Falls back to local repositories when offline
   * @param language Optional language filter
   * @returns Promise<Repository[]> Array of repositories
   */
  async searchRepositories(language?: string): Promise<Repository[]> {
    try {
      // Check if we're online
      const online = await this.isOnline();

      if (!online) {
        console.log('Device is offline, returning only downloaded repositories');
        // If offline, return only downloaded repositories
        const repos = await this.getDownloadedRepositories();
        if (language) {
          return repos.filter((repo) => repo.language === language);
        }
        return repos;
      }

      // Online mode - fetch from API
      const params = new URLSearchParams({
        subject: 'Open Bible Stories',
        ...(language && { lang: language }),
        stage: 'prod',
      });

      const response = await fetch(`https://git.door43.org/api/v1/catalog/search?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to search repositories: ${response.status}`);
      }

      const { data } = await response.json();
      console.log(`Found ${data.length} repositories in search results`, data);
      return await Promise.all(
        data.map(async (result: CatalogEntry) => {
          const owner = result.owner;
          const lang = result.language;
          const key = this.getRepositoryKey(owner, lang, result.name);
          const isDownloaded = this.downloadedRepos.has(key);

          // For thumbnails, use avatar url or fallback
          const thumbnailUrl =
            result.repo.avatar_url ||
            `https://cdn.door43.org/obs/jpg/360px/obs-en-${Math.floor(Math.random() * 50)}-01.jpg`;

          // Check for locally saved thumbnail if the repo is downloaded
          let localThumbnail = null;
          if (isDownloaded) {
            const localPath = this.getThumbnailLocalPath(owner, lang, result.name);
            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
              localThumbnail = localPath;
            }
          }

          return this.buildRepositoryObject(result, owner, lang, thumbnailUrl, localThumbnail);
        })
      );
    } catch (error) {
      warn(
        `Error searching repositories: ${error instanceof Error ? error.message : String(error)}`
      );

      // If network request fails, fall back to local repositories
      console.log('Falling back to local repositories due to search error');
      const repos = await this.getDownloadedRepositories();
      if (language) {
        return repos.filter((repo) => repo.language === language);
      }
      return repos;
    }
  }

  /**
   * Get all downloaded repositories with their full metadata
   * @returns Promise<Repository[]> Array of downloaded repositories
   */
  async getDownloadedRepositories(): Promise<Repository[]> {
    try {
      const downloadedReposObj = this.getDownloadedRepos();
      const repositories: Repository[] = [];

      for (const repo of downloadedReposObj) {
        try {
          // First validate metadata
          const isValid = await this.validateRepositoryMetadata(
            repo.owner,
            repo.language,
            repo.repositoryId
          );

          if (isValid) {
            // Get validated repository
            const repository = await this.getLocalRepository(
              repo.owner,
              repo.language,
              repo.repositoryId
            );

            if (repository) {
              repositories.push(repository);
              continue;
            }
          }

          // If validation or loading fails, fall back to basic info
          repositories.push({
            id: repo.repositoryId,
            owner: repo.owner,
            language: repo.language,
            displayName: repo.repositoryId,
            version: '1.0.0',
            lastUpdated: new Date(),
            isDownloaded: true,
          });
        } catch (error) {
          warn(`Error loading repository ${repo.repositoryId}: ${formatError(error)}`);
          // Add basic info even if there's an error
          repositories.push({
            id: repo.repositoryId,
            owner: repo.owner,
            language: repo.language,
            displayName: repo.repositoryId,
            version: '1.0.0',
            lastUpdated: new Date(),
            isDownloaded: true,
          });
        }
      }

      return repositories;
    } catch (error) {
      warn(
        `Error getting downloaded repositories: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  /**
   * Clear the in-memory repository cache
   * This can be useful to save memory or force a refresh
   */
  clearRepositoryCache(): void {
    this.repositories.clear();
  }

  /**
   * Check if a repository has updates available
   * @param owner Repository owner
   * @param language Repository language
   * @param repositoryId Repository ID
   * @returns Promise<boolean> True if updates available, false otherwise
   */
  async hasRepositoryUpdates(
    owner: string,
    language: string,
    repositoryId: string
  ): Promise<boolean> {
    try {
      // First check if we're online
      const online = await this.isOnline();
      if (!online) return false;

      // Get the current downloaded version
      const metadataPath = `${FileSystem.documentDirectory}obs-app/${language}/${owner}/metadata.json`;
      const fileInfo = await FileSystem.getInfoAsync(metadataPath);

      if (!fileInfo.exists) return false;

      const metadataContent = await FileSystem.readAsStringAsync(metadataPath);
      const metadata = JSON.parse(metadataContent);
      const currentVersion = metadata.version;

      // Check the latest version from the API
      const entryUrl = `https://git.door43.org/api/v1/catalog/entry/${owner}/${repositoryId}/master`;
      const entryResponse = await fetch(entryUrl);

      if (!entryResponse.ok) return false;

      const entryData: CatalogEntry = await entryResponse.json();
      const latestVersion = entryData.release?.tag_name || '1.0.0';

      // Compare versions (simple string comparison for now)
      return latestVersion !== currentVersion;
    } catch (error) {
      warn(`Error checking for repository updates: ${formatError(error)}`);
      return false;
    }
  }

  private async processAndStoreZip(
    owner: string,
    language: string,
    zipData: ArrayBuffer,
    repositoryId: string
  ): Promise<void> {
    try {
      // Create directory path
      const baseDir = `${FileSystem.documentDirectory}obs-app`;
      const langDir = `${baseDir}/${language}`;
      const ownerDir = `${langDir}/${owner}`;

      // Ensure directories exist
      await this.ensureDirectoryExists(baseDir);
      await this.ensureDirectoryExists(langDir);
      await this.ensureDirectoryExists(ownerDir);

      // Extract ZIP contents
      const zip = new JSZip();
      await zip.loadAsync(zipData);

      // Process each file in the zip
      for (const [filename, file] of Object.entries(zip.files)) {
        if (!file.dir) {
          const content = await file.async('string');
          const targetPath = `${ownerDir}/${filename.split('/').pop()}`;
          await FileSystem.writeAsStringAsync(targetPath, content);
        }
      }

      // Get the repository object for metadata
      const key = this.getRepositoryKey(owner, language, repositoryId);
      const repository = this.repositories.get(key);

      // Write metadata file with full repository information
      const metadataPath = `${ownerDir}/metadata.json`;
      const metadata = repository
        ? {
            ...repository,
            lastUpdated: new Date().toISOString(),
            isDownloaded: true,
          }
        : {
            id: repositoryId,
            owner,
            language,
            displayName: repositoryId,
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            isDownloaded: true,
          };

      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));
    } catch (error) {
      warn(`Error processing ZIP file: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async ensureDirectoryExists(dirUri: string): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirUri);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
      }
    } catch (error) {
      warn(`Error ensuring directory exists: ${formatError(error)}`);
      throw error;
    }
  }

  async getRepositoryDetails(owner: string, repoId: string): Promise<Repository | null> {
    // Use our existing getRepository method with the repo ID
    return this.getRepository(owner, '', repoId);
  }

  async deleteRepository(owner: string, language: string, repositoryId: string): Promise<void> {
    try {
      const key = this.getRepositoryKey(owner, language, repositoryId);

      // Remove from tracked downloads
      this.downloadedRepos.delete(key);
      await this.saveDownloadedRepos();

      // Update repository in cache if it exists
      if (this.repositories.has(key)) {
        const repo = this.repositories.get(key);
        if (repo) {
          repo.isDownloaded = false;
          repo.localThumbnail = undefined;
          this.repositories.set(key, repo);
        }
      }

      // Delete repository files from filesystem
      const baseDir = `${FileSystem.documentDirectory}obs-app`;
      const langDir = `${baseDir}/${language}`;
      const ownerDir = `${langDir}/${owner}`;

      const dirInfo = await FileSystem.getInfoAsync(ownerDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(ownerDir, { idempotent: true });
      }

      // Delete thumbnail if it exists
      const localThumbnailPath = this.getThumbnailLocalPath(owner, language, repositoryId);
      const thumbnailInfo = await FileSystem.getInfoAsync(localThumbnailPath);
      if (thumbnailInfo.exists) {
        await FileSystem.deleteAsync(localThumbnailPath, { idempotent: true });
      }

      console.log(`Deleted repository: ${owner}/${language}/${repositoryId}`);
    } catch (error) {
      warn(`Error deleting repository: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Validate and repair repository metadata if needed
   * @param owner Repository owner
   * @param language Repository language
   * @param repositoryId Repository ID
   * @returns Promise<boolean> True if validation successful, false otherwise
   */
  async validateRepositoryMetadata(
    owner: string,
    language: string,
    repositoryId: string
  ): Promise<boolean> {
    try {
      const metadataPath = `${FileSystem.documentDirectory}obs-app/${language}/${owner}/metadata.json`;
      const fileInfo = await FileSystem.getInfoAsync(metadataPath);

      if (!fileInfo.exists) {
        warn(`Repository metadata file not found: ${metadataPath}`);
        return false;
      }

      // Try to read and parse the metadata file
      try {
        const metadataContent = await FileSystem.readAsStringAsync(metadataPath);
        const metadata = JSON.parse(metadataContent);

        // Check if metadata has required fields
        if (!metadata.id || !metadata.owner || !metadata.language) {
          throw new Error('Missing required fields in metadata');
        }

        // Ensure values match expected values
        if (
          metadata.id !== repositoryId ||
          metadata.owner !== owner ||
          metadata.language !== language
        ) {
          throw new Error('Metadata values do not match expected values');
        }

        return true;
      } catch (error) {
        // Metadata is corrupted or invalid, attempt to repair
        warn(`Corrupted metadata detected: ${formatError(error)}`);

        // Create basic metadata as fallback
        const repairedMetadata = {
          id: repositoryId,
          owner,
          language,
          displayName: repositoryId,
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          isDownloaded: true,
        };

        // Write repaired metadata
        await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(repairedMetadata));
        warn('Repository metadata has been repaired with basic information');

        return true;
      }
    } catch (error) {
      warn(`Error validating repository metadata: ${formatError(error)}`);
      return false;
    }
  }

  /**
   * Get a local repository by ID, with validation and repair
   * @param owner Repository owner
   * @param language Repository language
   * @param repositoryId Repository ID
   * @returns Promise<Repository | null> The repository if found, null otherwise
   */
  async getLocalRepository(
    owner: string,
    language: string,
    repositoryId: string
  ): Promise<Repository | null> {
    try {
      // First validate the repository metadata
      const isValid = await this.validateRepositoryMetadata(owner, language, repositoryId);
      if (!isValid) return null;

      // Read the metadata file
      const metadataPath = `${FileSystem.documentDirectory}obs-app/${language}/${owner}/metadata.json`;
      const metadataContent = await FileSystem.readAsStringAsync(metadataPath);
      const metadata = JSON.parse(metadataContent);

      // Create Repository object from metadata
      const repository: Repository = {
        ...metadata,
        lastUpdated: new Date(metadata.lastUpdated || Date.now()),
        isDownloaded: true,
      };

      // Update cache
      const key = this.getRepositoryKey(owner, language, repositoryId);
      this.repositories.set(key, repository);

      return repository;
    } catch (error) {
      warn(`Error getting local repository: ${formatError(error)}`);
      return null;
    }
  }

  private async saveDownloadedRepos(): Promise<void> {
    try {
      const downloadedArray = Array.from(this.downloadedRepos);
      await AsyncStorage.setItem(
        RepositoryManager.DOWNLOADS_STORAGE_KEY,
        JSON.stringify(downloadedArray)
      );
    } catch (error) {
      warn(
        `Error saving downloaded repositories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
