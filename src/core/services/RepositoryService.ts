import { injectable, inject } from 'inversify';
import JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';
import { IStorage } from '../interfaces/IStorage';
import { IFileSystem } from '../interfaces/IFileSystem';
import { INetworkService } from '../interfaces/INetworkService';
import { IRepositoryService } from '../interfaces/IRepositoryService';
import { Repository } from '../interfaces/Repository';
import { TYPES } from '../container';
import { warn } from '../utils';

@injectable()
export class RepositoryService implements IRepositoryService {
  private static DOWNLOADS_STORAGE_KEY = '@obs_downloaded_repos';
  private static THUMBNAILS_DIR = 'thumbnails';
  private repositories: Map<string, Repository> = new Map();
  private downloadedRepos: Set<string> = new Set();

  constructor(
    @inject(TYPES.Storage) private storage: IStorage,
    @inject(TYPES.FileSystem) private fileSystem: IFileSystem,
    @inject(TYPES.NetworkService) private network: INetworkService
  ) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.loadDownloadedRepos();
  }

  private async loadDownloadedRepos(): Promise<void> {
    try {
      const downloads = await this.storage.getItem(RepositoryService.DOWNLOADS_STORAGE_KEY);
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

  private getRepositoryKey(owner: string, language: string, repositoryId: string): string {
    return `${owner}/${language}/${repositoryId}`;
  }

  private isRepositoryDownloaded(owner: string, language: string, repositoryId: string): boolean {
    const key = this.getRepositoryKey(owner, language, repositoryId);
    return this.downloadedRepos.has(key);
  }

  private getThumbnailLocalPath(owner: string, language: string, id: string): string {
    return `${this.fileSystem.documentDirectory}obs-app/${RepositoryService.THUMBNAILS_DIR}/${owner}_${language}_${id}.jpg`;
  }

  private async downloadThumbnail(thumbnailUrl: string, localPath: string): Promise<string | null> {
    try {
      const thumbnailsDir = `${this.fileSystem.documentDirectory}obs-app/${RepositoryService.THUMBNAILS_DIR}`;
      await this.ensureDirectoryExists(thumbnailsDir);

      const downloadResult = await this.fileSystem.downloadAsync(thumbnailUrl, localPath);

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

  private async ensureDirectoryExists(dirUri: string): Promise<void> {
    try {
      const dirInfo = await this.fileSystem.getInfoAsync(dirUri);
      if (!dirInfo.exists) {
        await this.fileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
      }
    } catch (error) {
      warn(`Error ensuring directory exists: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getRepository(
    owner: string,
    language: string,
    repositoryId: string
  ): Promise<Repository | null> {
    const key = this.getRepositoryKey(owner, language, repositoryId);

    if (this.repositories.has(key)) {
      const repo = this.repositories.get(key);
      if (repo) {
        repo.isDownloaded = this.isRepositoryDownloaded(owner, language, repositoryId);
        return repo;
      }
    }

    if (this.isRepositoryDownloaded(owner, language, repositoryId)) {
      try {
        const localRepo = await this.getLocalRepository(owner, language, repositoryId);
        if (localRepo) {
          return localRepo;
        }
      } catch (error) {
        warn(`Error loading repository from local storage: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const online = await this.network.isOnline();
    if (!online) {
      warn('Device is offline and repository not found in local cache');
      return null;
    }

    try {
      const params = new URLSearchParams({
        subject: 'Open Bible Stories',
        stage: 'prod',
      });

      if (owner) params.append('owner', owner);
      if (language) params.append('lang', language);

      const response = await this.network.fetch(
        `https://git.door43.org/api/v1/catalog/search?${params}`
      );
      if (!response.ok) {
        throw new Error(`Failed to search repository: ${response.status}`);
      }

      const data = await response.json();
      if (!data?.data?.length) {
        return null;
      }

      let repoData;
      if (repositoryId) {
        repoData = data.data.find((r: any) => r.name === repositoryId);
        if (!repoData) {
          return null;
        }
      } else {
        repoData = data.data[0];
      }

      const isDownloaded = this.isRepositoryDownloaded(owner, language, repositoryId);
      const thumbnailUrl =
        repoData.repo?.avatar_url ||
        `https://cdn.door43.org/obs/jpg/360px/obs-en-${Math.floor(Math.random() * 50)}-01.jpg`;

      let localThumbnail = null;
      if (isDownloaded) {
        const localPath = this.getThumbnailLocalPath(owner, language, repoData.name);
        const fileInfo = await this.fileSystem.getInfoAsync(localPath);
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
      warn(`Error getting repository: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async searchRepositories(language?: string): Promise<Repository[]> {
    try {
      const online = await this.network.isOnline();

      if (!online) {
        const repos = await this.getDownloadedRepositories();
        if (language) {
          return repos.filter((repo) => repo.language === language);
        }
        return repos;
      }

      const params = new URLSearchParams({
        subject: 'Open Bible Stories',
        ...(language && { lang: language }),
        stage: 'prod',
      });

      const response = await this.network.fetch(
        `https://git.door43.org/api/v1/catalog/search?${params}`
      );
      if (!response.ok) {
        throw new Error(`Failed to search repositories: ${response.status}`);
      }

      const { data } = await response.json();
      return await Promise.all(
        data.map(async (result: any) => {
          const owner = result.owner;
          const lang = result.language;
          const key = this.getRepositoryKey(owner, lang, result.name);
          const isDownloaded = this.downloadedRepos.has(key);

          const thumbnailUrl =
            result.repo.avatar_url ||
            `https://cdn.door43.org/obs/jpg/360px/obs-en-${Math.floor(Math.random() * 50)}-01.jpg`;

          let localThumbnail = null;
          if (isDownloaded) {
            const localPath = this.getThumbnailLocalPath(owner, lang, result.name);
            const fileInfo = await this.fileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
              localThumbnail = localPath;
            }
          }

          return {
            id: result.name,
            owner: result.owner || owner,
            language: result.language || language,
            displayName: result.title || result.name,
            description: result.repo?.description,
            version: result.release?.tag_name || '1.0.0',
            lastUpdated: new Date(result.release?.published_at || Date.now()),
            targetAudience: undefined,
            imagePack: undefined,
            thumbnail: thumbnailUrl,
            localThumbnail,
            isDownloaded,
          };
        })
      );
    } catch (error) {
      warn(`Error searching repositories: ${error instanceof Error ? error.message : String(error)}`);
      const repos = await this.getDownloadedRepositories();
      if (language) {
        return repos.filter((repo) => repo.language === language);
      }
      return repos;
    }
  }

  async downloadRepository(
    owner: string,
    language: string,
    repositoryId: string,
    version: string = 'master'
  ): Promise<void> {
    try {
      const repo = await this.getRepository(owner, language, repositoryId);
      if (!repo) {
        throw new Error('Repository not found');
      }

      const entryUrl = `https://git.door43.org/api/v1/catalog/entry/${owner}/${repositoryId}/${version}`;
      const entryResponse = await this.network.fetch(entryUrl);
      if (!entryResponse.ok) {
        throw new Error(`Failed to get repository entry: ${entryResponse.status}`);
      }

      const entryData = await entryResponse.json();
      const zipballUrl = entryData?.zipball_url || `https://git.door43.org/${owner}/${repositoryId}/archive/${version}.zip`;

      const downloadResponse = await this.network.fetch(zipballUrl);
      if (!downloadResponse.ok) {
        throw new Error(`Failed to download repository: ${downloadResponse.status}`);
      }

      const zipData = await downloadResponse.arrayBuffer();
      if (!zipData) {
        throw new Error('Failed to get ZIP data: response data is empty');
      }

      await this.processAndStoreZip(owner, language, zipData, repositoryId);

      if (repo.thumbnail) {
        const localThumbnailPath = this.getThumbnailLocalPath(owner, language, repo.id);
        const downloadedThumbnail = await this.downloadThumbnail(
          repo.thumbnail,
          localThumbnailPath
        );

        if (downloadedThumbnail) {
          const key = this.getRepositoryKey(owner, language, repositoryId);
          const cachedRepo = this.repositories.get(key);
          if (cachedRepo) {
            cachedRepo.localThumbnail = downloadedThumbnail;
          }
        }
      }

      const key = this.getRepositoryKey(owner, language, repositoryId);
      this.downloadedRepos.add(key);
      await this.saveDownloadedRepos();

      if (this.repositories.has(key)) {
        const cachedRepo = this.repositories.get(key);
        if (cachedRepo) {
          cachedRepo.isDownloaded = true;
          this.repositories.set(key, cachedRepo);
        }
      }
    } catch (error) {
      warn(`Error downloading repository: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async deleteRepository(owner: string, language: string, repositoryId: string): Promise<void> {
    try {
      const key = this.getRepositoryKey(owner, language, repositoryId);

      this.downloadedRepos.delete(key);
      await this.saveDownloadedRepos();

      if (this.repositories.has(key)) {
        const repo = this.repositories.get(key);
        if (repo) {
          repo.isDownloaded = false;
          repo.localThumbnail = undefined;
          this.repositories.set(key, repo);
        }
      }

      const baseDir = `${this.fileSystem.documentDirectory}obs-app`;
      const langDir = `${baseDir}/${language}`;
      const ownerDir = `${langDir}/${owner}`;

      const dirInfo = await this.fileSystem.getInfoAsync(ownerDir);
      if (dirInfo.exists) {
        await this.fileSystem.deleteAsync(ownerDir, { idempotent: true });
      }

      const localThumbnailPath = this.getThumbnailLocalPath(owner, language, repositoryId);
      const thumbnailInfo = await this.fileSystem.getInfoAsync(localThumbnailPath);
      if (thumbnailInfo.exists) {
        await this.fileSystem.deleteAsync(localThumbnailPath, { idempotent: true });
      }
    } catch (error) {
      warn(`Error deleting repository: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getDownloadedRepositories(): Promise<Repository[]> {
    try {
      const downloadedReposObj = Array.from(this.downloadedRepos).map((key) => {
        const [owner, language, repositoryId] = key.split('/');
        return { owner, language, repositoryId };
      });

      const repositories: Repository[] = [];

      for (const repo of downloadedReposObj) {
        try {
          const isValid = await this.validateRepositoryMetadata(
            repo.owner,
            repo.language,
            repo.repositoryId
          );

          if (isValid) {
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
          warn(`Error loading repository ${repo.repositoryId}: ${error instanceof Error ? error.message : String(error)}`);
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
      warn(`Error getting downloaded repositories: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async hasRepositoryUpdates(
    owner: string,
    language: string,
    repositoryId: string
  ): Promise<boolean> {
    try {
      const online = await this.network.isOnline();
      if (!online) return false;

      const metadataPath = `${this.fileSystem.documentDirectory}obs-app/${language}/${owner}/metadata.json`;
      const fileInfo = await this.fileSystem.getInfoAsync(metadataPath);

      if (!fileInfo.exists) return false;

      const metadataContent = await this.fileSystem.readAsStringAsync(metadataPath);
      const metadata = JSON.parse(metadataContent);
      const currentVersion = metadata.version;

      const entryUrl = `https://git.door43.org/api/v1/catalog/entry/${owner}/${repositoryId}/master`;
      const entryResponse = await this.network.fetch(entryUrl);

      if (!entryResponse.ok) return false;

      const entryData = await entryResponse.json();
      const latestVersion = entryData.release?.tag_name || '1.0.0';

      return latestVersion !== currentVersion;
    } catch (error) {
      warn(`Error checking for repository updates: ${error instanceof Error ? error.message : String(error)}`);
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
      const baseDir = `${this.fileSystem.documentDirectory}obs-app`;
      const langDir = `${baseDir}/${language}`;
      const ownerDir = `${langDir}/${owner}`;

      await this.ensureDirectoryExists(baseDir);
      await this.ensureDirectoryExists(langDir);
      await this.ensureDirectoryExists(ownerDir);

      const zip = new JSZip();
      await zip.loadAsync(zipData);

      for (const [filename, file] of Object.entries(zip.files)) {
        if (!file.dir) {
          const content = await file.async('string');
          const targetPath = `${ownerDir}/${filename.split('/').pop()}`;
          await this.fileSystem.writeAsStringAsync(targetPath, content);
        }
      }

      const key = this.getRepositoryKey(owner, language, repositoryId);
      const repository = this.repositories.get(key);

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

      await this.fileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));
    } catch (error) {
      warn(`Error processing ZIP file: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async validateRepositoryMetadata(
    owner: string,
    language: string,
    repositoryId: string
  ): Promise<boolean> {
    try {
      const metadataPath = `${this.fileSystem.documentDirectory}obs-app/${language}/${owner}/metadata.json`;
      const fileInfo = await this.fileSystem.getInfoAsync(metadataPath);

      if (!fileInfo.exists) {
        warn(`Repository metadata file not found: ${metadataPath}`);
        return false;
      }

      try {
        const metadataContent = await this.fileSystem.readAsStringAsync(metadataPath);
        const metadata = JSON.parse(metadataContent);

        if (!metadata.id || !metadata.owner || !metadata.language) {
          throw new Error('Missing required fields in metadata');
        }

        if (
          metadata.id !== repositoryId ||
          metadata.owner !== owner ||
          metadata.language !== language
        ) {
          throw new Error('Metadata values do not match expected values');
        }

        return true;
      } catch (error) {
        warn(`Corrupted metadata detected: ${error instanceof Error ? error.message : String(error)}`);

        const repairedMetadata = {
          id: repositoryId,
          owner,
          language,
          displayName: repositoryId,
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          isDownloaded: true,
        };

        await this.fileSystem.writeAsStringAsync(metadataPath, JSON.stringify(repairedMetadata));
        warn('Repository metadata has been repaired with basic information');

        return true;
      }
    } catch (error) {
      warn(`Error validating repository metadata: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private async getLocalRepository(
    owner: string,
    language: string,
    repositoryId: string
  ): Promise<Repository | null> {
    try {
      const isValid = await this.validateRepositoryMetadata(owner, language, repositoryId);
      if (!isValid) return null;

      const metadataPath = `${this.fileSystem.documentDirectory}obs-app/${language}/${owner}/metadata.json`;
      const metadataContent = await this.fileSystem.readAsStringAsync(metadataPath);
      const metadata = JSON.parse(metadataContent);

      const repository: Repository = {
        ...metadata,
        lastUpdated: new Date(metadata.lastUpdated || Date.now()),
        isDownloaded: true,
      };

      const key = this.getRepositoryKey(owner, language, repositoryId);
      this.repositories.set(key, repository);

      return repository;
    } catch (error) {
      warn(`Error getting local repository: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private async saveDownloadedRepos(): Promise<void> {
    try {
      const downloadedArray = Array.from(this.downloadedRepos);
      await this.storage.setItem(
        RepositoryService.DOWNLOADS_STORAGE_KEY,
        JSON.stringify(downloadedArray)
      );
    } catch (error) {
      warn(
        `Error saving downloaded repositories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
