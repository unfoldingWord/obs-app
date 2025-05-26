import { injectable, inject } from 'inversify';
import { IStorage } from '../interfaces/IStorage';
import { IFileSystem } from '../interfaces/IFileSystem';
import { INetworkService } from '../interfaces/INetworkService';
import { IRepositoryManager } from '../interfaces/IRepositoryManager';
import { IRepositoryConfig, DEFAULT_CONFIG } from '../interfaces/IRepositoryConfig';
import { Repository } from '../interfaces/Repository';
import { TYPES } from '../container';

@injectable()
export abstract class BaseRepositoryManager implements IRepositoryManager {
  protected repositories: Map<string, Repository> = new Map();
  protected downloadedRepos: Set<string> = new Set();
  protected config: IRepositoryConfig;

  constructor(
    @inject(TYPES.Storage) protected storage: IStorage,
    @inject(TYPES.FileSystem) protected fileSystem: IFileSystem,
    @inject(TYPES.NetworkService) protected network: INetworkService,
    config: Partial<IRepositoryConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  protected abstract initialize(): Promise<void>;

  protected getRepositoryKey(owner: string, language: string, repositoryId: string): string {
    return `${owner}/${language}/${repositoryId}`;
  }

  getRepositoryPath(owner: string, language: string, repositoryId: string): string {
    return `${this.fileSystem.documentDirectory}${this.config.appDir}/${language}/${owner}`;
  }

  getThumbnailPath(owner: string, language: string, repositoryId: string): string {
    return `${this.fileSystem.documentDirectory}${this.config.appDir}/${this.config.thumbnailsDir}/${owner}_${language}_${repositoryId}.jpg`;
  }

  async isRepositoryDownloaded(owner: string, language: string, repositoryId: string): Promise<boolean> {
    const key = this.getRepositoryKey(owner, language, repositoryId);
    return this.downloadedRepos.has(key);
  }

  protected async ensureDirectoryExists(dirUri: string): Promise<void> {
    try {
      const dirInfo = await this.fileSystem.getInfoAsync(dirUri);
      if (!dirInfo.exists) {
        await this.fileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
      }
    } catch (error) {
      throw new Error(`Error ensuring directory exists: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  protected async validateRepositoryMetadata(
    owner: string,
    language: string,
    repositoryId: string
  ): Promise<boolean> {
    try {
      const metadataPath = `${this.getRepositoryPath(owner, language, repositoryId)}/metadata.json`;
      const fileInfo = await this.fileSystem.getInfoAsync(metadataPath);

      if (!fileInfo.exists) {
        return false;
      }

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
      return false;
    }
  }

  // Abstract methods that must be implemented by concrete classes
  abstract getRepository(owner: string, language: string, repositoryId: string): Promise<Repository | null>;
  abstract searchRepositories(language?: string): Promise<Repository[]>;
  abstract downloadRepository(owner: string, language: string, repositoryId: string, version?: string): Promise<void>;
  abstract deleteRepository(owner: string, language: string, repositoryId: string): Promise<void>;
  abstract getDownloadedRepositories(): Promise<Repository[]>;
  abstract hasRepositoryUpdates(owner: string, language: string, repositoryId: string): Promise<boolean>;
}
