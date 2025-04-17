import { CatalogSearchResult } from './catalogTypes';
import { warn } from './utils';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  private constructor() {
    this.loadDownloadedRepos();
  }

  static getInstance(): RepositoryManager {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager();
    }
    return RepositoryManager.instance;
  }

  private async loadDownloadedRepos(): Promise<void> {
    try {
      const downloads = await AsyncStorage.getItem(RepositoryManager.DOWNLOADS_STORAGE_KEY);
      if (downloads) {
        const downloadedArray = JSON.parse(downloads) as string[];
        this.downloadedRepos = new Set(downloadedArray);
      }
    } catch (error) {
      warn(`Error loading downloaded repositories: ${error instanceof Error ? error.message : String(error)}`);
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
      warn(`Error saving downloaded repositories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getRepositoryKey(owner: string, language: string): string {
    return `${owner}/${language}`;
  }

  isRepositoryDownloaded(owner: string, language: string): boolean {
    const key = this.getRepositoryKey(owner, language);
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
      warn(`Error downloading thumbnail: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async getRepository(owner: string, language: string): Promise<Repository | null> {
    const key = this.getRepositoryKey(owner, language);

    // Check if repository exists in cache
    if (this.repositories.has(key)) {
      const repo = this.repositories.get(key);
      if (repo) {
        // Set the downloaded status
        repo.isDownloaded = this.isRepositoryDownloaded(owner, language);
        return repo;
      }
    }

    try {
      // Search for repository using catalog endpoint
      const params = new URLSearchParams({
        subject: 'Open Bible Stories',
        lang: language,
        owner: owner,
        stage: 'prod',
      });

      const response = await fetch(`https://git.door43.org/api/v1/catalog/search?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to search repository: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.length) {
        return null;
      }

      const repoData = data[0];
      const isDownloaded = this.isRepositoryDownloaded(owner, language);
      const thumbnailUrl = repoData.avatar_url || `https://cdn.door43.org/obs/jpg/360px/obs-en-${Math.floor(Math.random() * 50)}-01.jpg`;

      // Check if we have a locally saved thumbnail
      let localThumbnail = null;
      if (isDownloaded) {
        const localPath = this.getThumbnailLocalPath(owner, language, repoData.id);
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          localThumbnail = localPath;
        }
      }

      const repository: Repository = {
        id: repoData.id,
        owner,
        language,
        displayName: repoData.title,
        description: repoData.description,
        version: repoData.version,
        lastUpdated: new Date(repoData.lastUpdated),
        targetAudience: repoData.targetAudience,
        imagePack: repoData.imagePack,
        isDownloaded,
        thumbnail: thumbnailUrl,
        localThumbnail,
      };

      this.repositories.set(key, repository);
      return repository;
    } catch (error) {
      warn(`Error getting repository: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async downloadRepository(owner: string, language: string): Promise<void> {
    try {
      // Get repository details
      const repo = await this.getRepository(owner, language);
      if (!repo) {
        throw new Error('Repository not found');
      }

      // Download repository ZIP
      const response = await fetch(`https://git.door43.org/api/v1/repos/${owner}/${language}_obs/archive/zipball`);
      if (!response.ok) {
        throw new Error(`Failed to download repository: ${response.status}`);
      }

      // Get ZIP data as blob
      const blob = await response.blob();
      const zipData = await blob.arrayBuffer();

      // Process and store the ZIP file
      await this.processAndStoreZip(owner, language, zipData);

      // Download and save the thumbnail
      if (repo.thumbnail) {
        const localThumbnailPath = this.getThumbnailLocalPath(owner, language, repo.id);
        const downloadedThumbnail = await this.downloadThumbnail(repo.thumbnail, localThumbnailPath);

        // Update the repository cache with the local thumbnail path
        if (downloadedThumbnail && this.repositories.has(this.getRepositoryKey(owner, language))) {
          const cachedRepo = this.repositories.get(this.getRepositoryKey(owner, language));
          if (cachedRepo) {
            cachedRepo.localThumbnail = downloadedThumbnail;
          }
        }
      }

      // Mark repository as downloaded
      const key = this.getRepositoryKey(owner, language);
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
      warn(`Error downloading repository: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async processAndStoreZip(owner: string, language: string, zipData: ArrayBuffer): Promise<void> {
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

      // Write metadata file with version information
      const metadataPath = `${ownerDir}/metadata.json`;
      const repo = await this.getRepository(owner, language);
      const metadata = {
        id: repo?.id,
        owner,
        language,
        version: repo?.version,
        lastUpdated: new Date().toISOString(),
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

  async searchRepositories(language?: string): Promise<Repository[]> {
    try {
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
      return await Promise.all(data.map(async (result: CatalogSearchResult) => {
        const owner = result.owner;
        const lang = result.language;
        const key = this.getRepositoryKey(owner, lang);
        const isDownloaded = this.downloadedRepos.has(key);

        // For thumbnails, use avatar url or fallback
        const thumbnailUrl = result.repo.avatar_url || `https://cdn.door43.org/obs/jpg/360px/obs-en-${Math.floor(Math.random() * 50)}-01.jpg`;

        // Check for locally saved thumbnail if the repo is downloaded
        let localThumbnail = null;
        if (isDownloaded) {
          const localPath = this.getThumbnailLocalPath(owner, lang, result.name);
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (fileInfo.exists) {
            localThumbnail = localPath;
          }
        }

        return {
          id: result.name,
          owner: result.owner,
          language: result.language,
          displayName: result.title,
          description: result.repo.description,
          version: result.release.tag_name,
          lastUpdated: new Date(result.release.published_at),
          targetAudience: 'general', //TODO: add target audience
          imagePack: 'default', //TODO: add image pack
          thumbnail: thumbnailUrl,
          localThumbnail,
          isDownloaded,
        };
      }));
    } catch (error) {
      warn(`Error searching repositories: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async getRepositoryDetails(owner: string, repo: string): Promise<Repository | null> {
    try {
      const params = new URLSearchParams({
        subject: 'Open Bible Stories',
        owner,
        stage: 'prod',
      });

      const response = await fetch(`https://git.door43.org/api/v1/catalog/search?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to get repository details: ${response.status}`);
      }

      const data = await response.json();
      const repoData = data.find((r: any) => r.id === repo);
      if (!repoData) {
        return null;
      }

      const language = repoData.language;
      const key = this.getRepositoryKey(owner, language);
      const isDownloaded = this.downloadedRepos.has(key);

      // For thumbnails, use avatar url or fallback
      const thumbnailUrl = repoData.avatar_url || `https://cdn.door43.org/obs/jpg/360px/obs-en-${Math.floor(Math.random() * 50)}-01.jpg`;

      // Check for locally saved thumbnail if the repo is downloaded
      let localThumbnail = null;
      if (isDownloaded) {
        const localPath = this.getThumbnailLocalPath(owner, language, repoData.id);
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          localThumbnail = localPath;
        }
      }

      return {
        id: repoData.id,
        owner,
        language: repoData.language,
        displayName: repoData.title,
        description: repoData.description,
        version: repoData.version,
        lastUpdated: new Date(repoData.lastUpdated),
        targetAudience: repoData.targetAudience,
        imagePack: repoData.imagePack,
        isDownloaded,
        thumbnail: thumbnailUrl,
        localThumbnail,
      };
    } catch (error) {
      warn(`Error getting repository details: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async deleteRepository(owner: string, language: string): Promise<void> {
    try {
      const key = this.getRepositoryKey(owner, language);

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
      const repo = await this.getRepository(owner, language);
      if (repo) {
        const localThumbnailPath = this.getThumbnailLocalPath(owner, language, repo.id);
        const thumbnailInfo = await FileSystem.getInfoAsync(localThumbnailPath);
        if (thumbnailInfo.exists) {
          await FileSystem.deleteAsync(localThumbnailPath, { idempotent: true });
        }
      }

      console.log(`Deleted repository: ${owner}/${language}`);
    } catch (error) {
      warn(`Error deleting repository: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
