import { Container } from 'inversify';

import { IFileSystem } from './interfaces/IFileSystem';
import { INetworkService } from './interfaces/INetworkService';
import { IRepositoryService } from './interfaces/IRepositoryService';
import { IStorage } from './interfaces/IStorage';
import { AsyncStorageService } from './services/AsyncStorageService';
import { FileSystemService } from './services/FileSystemService';
import { NetworkService } from './services/NetworkService';
import { RepositoryService } from './services/RepositoryService';

export const TYPES = {
  Storage: Symbol.for('Storage'),
  FileSystem: Symbol.for('FileSystem'),
  NetworkService: Symbol.for('NetworkService'),
  RepositoryService: Symbol.for('RepositoryService'),
};

const container = new Container();

// Bind services
container.bind<IStorage>(TYPES.Storage).to(AsyncStorageService).inSingletonScope();
container.bind<IFileSystem>(TYPES.FileSystem).to(FileSystemService).inSingletonScope();
container.bind<INetworkService>(TYPES.NetworkService).to(NetworkService).inSingletonScope();
container
  .bind<IRepositoryService>(TYPES.RepositoryService)
  .to(RepositoryService)
  .inSingletonScope();

export { container };
