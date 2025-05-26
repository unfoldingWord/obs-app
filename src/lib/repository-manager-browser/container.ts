import { Container } from 'inversify';
import { TYPES, IStorage, IFileSystem, INetworkService, IRepositoryManager } from '@your-org/repository-manager-core';
import { BrowserStorageService } from './services/BrowserStorageService';
import { BrowserFileSystemService } from './services/BrowserFileSystemService';
import { BrowserNetworkService } from './services/BrowserNetworkService';
import { BrowserRepositoryManager } from './BrowserRepositoryManager';

export function createBrowserContainer(): Container {
  const container = new Container();

  // Bind browser-specific implementations
  container.bind<IStorage>(TYPES.IStorage).to(BrowserStorageService).inSingletonScope();
  container.bind<IFileSystem>(TYPES.IFileSystem).to(BrowserFileSystemService).inSingletonScope();
  container.bind<INetworkService>(TYPES.INetworkService).to(BrowserNetworkService).inSingletonScope();
  container.bind<IRepositoryManager>(TYPES.IRepositoryManager).to(BrowserRepositoryManager).inSingletonScope();

  return container;
}
