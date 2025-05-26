# Repository Manager Core

A platform-agnostic library for managing repositories. This core library provides the foundation for repository management with dependency injection support.

## Features

- 🔄 Dependency Injection using Inversify
- 📦 Repository download and management
- 🔍 Repository search and discovery
- 💾 Storage abstraction
- 🖼️ Thumbnail management
- 🔄 Update checking
- 📱 Offline support
- 🧪 Testable architecture

## Installation

```bash
npm install @your-org/repository-manager-core inversify reflect-metadata
```

## Core Interfaces

### IStorage

Abstract storage interface that can be implemented for any platform:

```typescript
interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

### IFileSystem

Abstract file system interface:

```typescript
interface IFileSystem {
  documentDirectory: string;
  getInfoAsync(uri: string): Promise<{ exists: boolean }>;
  makeDirectoryAsync(uri: string, options?: { intermediates: boolean }): Promise<void>;
  deleteAsync(uri: string, options?: { idempotent: boolean }): Promise<void>;
  writeAsStringAsync(uri: string, content: string): Promise<void>;
  readAsStringAsync(uri: string): Promise<string>;
  downloadAsync(uri: string, localUri: string): Promise<{ status: number }>;
}
```

### INetworkService

Abstract network service interface:

```typescript
interface INetworkService {
  isOnline(): Promise<boolean>;
  fetch(url: string, options?: RequestInit): Promise<Response>;
}
```

### IRepositoryManager

The main interface for repository management:

```typescript
interface IRepositoryManager {
  getRepository(owner: string, language: string, repositoryId: string): Promise<Repository | null>;
  searchRepositories(language?: string): Promise<Repository[]>;
  downloadRepository(owner: string, language: string, repositoryId: string, version?: string): Promise<void>;
  deleteRepository(owner: string, language: string, repositoryId: string): Promise<void>;
  getDownloadedRepositories(): Promise<Repository[]>;
  hasRepositoryUpdates(owner: string, language: string, repositoryId: string): Promise<boolean>;
  getRepositoryPath(owner: string, language: string, repositoryId: string): string;
  getThumbnailPath(owner: string, language: string, repositoryId: string): string;
  isRepositoryDownloaded(owner: string, language: string, repositoryId: string): Promise<boolean>;
}
```

## Usage

The core library is designed to be extended for specific platforms. Here's how to use it:

```typescript
import { Container } from 'inversify';
import { createContainer, TYPES } from '@your-org/repository-manager-core';
import { YourStorageImplementation } from './YourStorageImplementation';
import { YourFileSystemImplementation } from './YourFileSystemImplementation';
import { YourNetworkServiceImplementation } from './YourNetworkServiceImplementation';
import { YourRepositoryManager } from './YourRepositoryManager';

// Create and configure the container
const container = createContainer();

// Bind your platform-specific implementations
container.bind(TYPES.Storage).to(YourStorageImplementation).inSingletonScope();
container.bind(TYPES.FileSystem).to(YourFileSystemImplementation).inSingletonScope();
container.bind(TYPES.NetworkService).to(YourNetworkServiceImplementation).inSingletonScope();
container.bind(TYPES.RepositoryManager).to(YourRepositoryManager).inSingletonScope();

// Use in your application
const repositoryManager = container.get(TYPES.RepositoryManager);
```

## Testing

The library is designed to be easily testable. You can use the provided mock implementations:

```typescript
import { Container } from 'inversify';
import { createContainer, TYPES } from '@your-org/repository-manager-core';
import { MockStorage } from './mocks/MockStorage';
import { MockFileSystem } from './mocks/MockFileSystem';
import { MockNetworkService } from './mocks/MockNetworkService';

describe('YourRepositoryManager', () => {
  let container: Container;
  let repositoryManager: IRepositoryManager;

  beforeEach(() => {
    container = createContainer();

    // Bind mock implementations
    container.bind(TYPES.Storage).to(MockStorage).inSingletonScope();
    container.bind(TYPES.FileSystem).to(MockFileSystem).inSingletonScope();
    container.bind(TYPES.NetworkService).to(MockNetworkService).inSingletonScope();
    container.bind(TYPES.RepositoryManager).to(YourRepositoryManager).inSingletonScope();

    repositoryManager = container.get(TYPES.RepositoryManager);
  });

  // Your tests here...
});
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
