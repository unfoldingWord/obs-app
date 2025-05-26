import { Container } from 'inversify';
import { TYPES, IStorage, IFileSystem, INetworkService, IRepositoryManager } from '@your-org/repository-manager-core';
import { ExpoStorageService } from './services/ExpoStorageService';
import { ExpoFileSystemService } from './services/ExpoFileSystemService';
import { ExpoNetworkService } from './services/ExpoNetworkService';
import { ExpoRepositoryManager } from './ExpoRepositoryManager';

export function createExpoContainer(): Container {
  const container = new Container();

  // Bind Expo-specific implementations
  container.bind<IStorage>(TYPES.IStorage).to(ExpoStorageService).inSingletonScope();
  container.bind<IFileSystem>(TYPES.IFileSystem).to(ExpoFileSystemService).inSingletonScope();
  container.bind<INetworkService>(TYPES.INetworkService).to(ExpoNetworkService).inSingletonScope();
  container.bind<IRepositoryManager>(TYPES.IRepositoryManager).to(ExpoRepositoryManager).inSingletonScope();

  return container;
}
