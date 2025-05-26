import { injectable } from 'inversify';
import JSZip from 'jszip';
import { BaseRepositoryManager } from './BaseRepositoryManager';
import { Repository } from '../interfaces/Repository';

@injectable()
export class OBSRepositoryManager extends BaseRepositoryManager {
  protected async initialize(): Promise<void> {
    await this.loadDownloadedRepos();
  }

  private async loadDownloadedRepos(): Promise<void> {
    try {
      const downloads = await this.storage.getItem(this.config.storageKey);
      if (downloads) {
        const downloadedArray = JSON.parse(downloads) as string[];
        this.downloadedRepos = new Set(downloadedArray);
      }
    } catch (error) {
      console.warn('Error loading downloaded repositories:', error);
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
        repo.isDownloaded = await this.isRepositoryDownloaded(owner, language, repositoryId);
        return repo;
      }
    }

    if (await this.isRepositoryDownloaded(owner, language, repositoryId)) {
      try {
        const localRepo = await this.getLocalRepository(owner, language, repositoryId);
        if (localRepo) {
          return localRepo;
        }
      } catch (error) {
        console.warn('Error loading repository from local storage:', error);
      }
    }

    const online = await this.network.isOnline();
    if (!online) {
      console.warn('Device is offline and repository not found in local cache');
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
        `${this.config.baseUrl}/catalog/search?${params}`
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

      const isDownloaded = await this.isRepositoryDownloaded(owner, language, repositoryId);
      const thumbnailUrl =
        repoData.repo?.avatar_url ||
        `https://cdn.door43.org/obs/jpg/360px/obs-en-${Math.floor(Math.random() * 50)}-01.jpg`;

      let localThumbnail = null;
      if (isDownloaded) {
        const localPath = this.getThumbnailPath(owner, language, repoData.name);
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
      console.warn('Error getting repository:', error);
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
        `${this.config.baseUrl}/catalog/search?${params}`
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
            const localPath = this.getThumbnailPath(owner, lang, result.name);
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
      console.warn('Error searching repositories:', error);
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

      const entryUrl = `${this.config.baseUrl}/catalog/entry/${owner}/${repositoryId}/${version}`;
      const entryResponse = await this.network.fetch(entryUrl);
      if (!entryResponse.ok) {
        throw new Error(`Failed to get repository entry: ${entryResponse.status}`);
      }

      const entryData = await entryResponse.json();
      const zipballUrl = entryData?.zipball_url || `${this.config.baseUrl}/${owner}/${repositoryId}/archive/${version}.zip`;

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
        const localThumbnailPath = this.getThumbnailPath(owner, language, repo.id);
        await this.downloadThumbnail(repo.thumbnail, localThumbnailPath);
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
      console.warn('Error downloading repository:', error);
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

      const baseDir = `${this.fileSystem.documentDirectory}${this.config.appDir}`;
      const langDir = `${baseDir}/${language}`;
      const ownerDir = `${langDir}/${owner}`;

      const dirInfo = await this.fileSystem.getInfoAsync(ownerDir);
      if (dirInfo.exists) {
        await this.fileSystem.deleteAsync(ownerDir, { idempotent: true });
      }

      const localThumbnailPath = this.getThumbnailPath(owner, language, repositoryId);
      const thumbnailInfo = await this.fileSystem.getInfoAsync(localThumbnailPath);
      if (thumbnailInfo.exists) {
        await this.fileSystem.deleteAsync(localThumbnailPath, { idempotent: true });
      }
    } catch (error) {
      console.warn('Error deleting repository:', error);
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
          console.warn(`Error loading repository ${repo.repositoryId}:`, error);
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
      console.warn('Error getting downloaded repositories:', error);
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

      const metadataPath = `${this.getRepositoryPath(owner, language, repositoryId)}/metadata.json`;
      const fileInfo = await this.fileSystem.getInfoAsync(metadataPath);

      if (!fileInfo.exists) return false;

      const metadataContent = await this.fileSystem.readAsStringAsync(metadataPath);
      const metadata = JSON.parse(metadataContent);
      const currentVersion = metadata.version;

      const entryUrl = `${this.config.baseUrl}/catalog/entry/${owner}/${repositoryId}/master`;
      const entryResponse = await this.network.fetch(entryUrl);

      if (!entryResponse.ok) return false;

      const entryData = await entryResponse.json();
      const latestVersion = entryData.release?.tag_name || '1.0.0';

      return latestVersion !== currentVersion;
    } catch (error) {
      console.warn('Error checking for repository updates:', error);
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
      const baseDir = `${this.fileSystem.documentDirectory}${this.config.appDir}`;
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
      console.warn('Error processing ZIP file:', error);
      throw error;
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

      const metadataPath = `${this.getRepositoryPath(owner, language, repositoryId)}/metadata.json`;
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
      console.warn('Error getting local repository:', error);
      return null;
    }
  }

  private async saveDownloadedRepos(): Promise<void> {
    try {
      const downloadedArray = Array.from(this.downloadedRepos);
      await this.storage.setItem(this.config.storageKey, JSON.stringify(downloadedArray));
    } catch (error) {
      console.warn('Error saving downloaded repositories:', error);
    }
  }

  private async downloadThumbnail(thumbnailUrl: string, localPath: string): Promise<string | null> {
    try {
      const thumbnailsDir = `${this.fileSystem.documentDirectory}${this.config.appDir}/${this.config.thumbnailsDir}`;
      await this.ensureDirectoryExists(thumbnailsDir);

      const downloadResult = await this.fileSystem.downloadAsync(thumbnailUrl, localPath);

      if (downloadResult.status === 200) {
        return localPath;
      } else {
        console.warn(`Error downloading thumbnail: HTTP status ${downloadResult.status}`);
        return null;
      }
    } catch (error) {
      console.warn('Error downloading thumbnail:', error);
      return null;
    }
  }
}
