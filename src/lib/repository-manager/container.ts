import { Container } from 'inversify';
import { IStorage } from './interfaces/IStorage';
import { IFileSystem } from './interfaces/IFileSystem';
import { INetworkService } from './interfaces/INetworkService';
import { IRepositoryManager } from './interfaces/IRepositoryManager';

export const TYPES = {
  Storage: Symbol.for('Storage'),
  FileSystem: Symbol.for('FileSystem'),
  NetworkService: Symbol.for('NetworkService'),
  RepositoryManager: Symbol.for('RepositoryManager'),
};

export const createContainer = (): Container => {
  const container = new Container();

  // Bind the interfaces to their implementations
  // Note: These will be bound by the consuming application
  container.bind<IStorage>(TYPES.Storage).toDynamicValue(() => {
    throw new Error('Storage implementation must be provided');
  });

  container.bind<IFileSystem>(TYPES.FileSystem).toDynamicValue(() => {
    throw new Error('FileSystem implementation must be provided');
  });

  container.bind<INetworkService>(TYPES.NetworkService).toDynamicValue(() => {
    throw new Error('NetworkService implementation must be provided');
  });

  container.bind<IRepositoryManager>(TYPES.RepositoryManager).toDynamicValue(() => {
    throw new Error('RepositoryManager implementation must be provided');
  });

  return container;
};
