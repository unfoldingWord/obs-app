import { injectable } from 'inversify';
import { BaseRepositoryManager } from '@your-org/repository-manager-core';
import { IRepositoryConfig } from '@your-org/repository-manager-core';

@injectable()
export class ExpoRepositoryManager extends BaseRepositoryManager {
  constructor(
    @inject(TYPES.Storage) storage: IStorage,
    @inject(TYPES.FileSystem) fileSystem: IFileSystem,
    @inject(TYPES.NetworkService) network: INetworkService,
    config: Partial<IRepositoryConfig> = {}
  ) {
    super(storage, fileSystem, network, {
      ...config,
      // Add any Expo-specific default configuration here
    });
  }

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

  // Override any methods that need Expo-specific behavior
  // For example, you might want to add Expo-specific error handling
  // or use Expo's FileSystem features in a different way
}
