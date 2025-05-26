# Repository Manager Library

A flexible and testable library for managing repositories in React Native applications. This library provides a robust foundation for downloading, managing, and updating repositories with support for offline functionality.

## Features

- 🔄 Dependency Injection using Inversify
- 📦 Repository download and management
- 🔍 Repository search and discovery
- 💾 Local storage and caching
- 🖼️ Thumbnail management
- 🔄 Update checking
- 📱 Offline support
- 🧪 Testable architecture

## Installation

```bash
npm install @your-org/repository-manager inversify reflect-metadata
```

## Basic Usage

```typescript
import { Container } from 'inversify';
import { createContainer, TYPES } from '@your-org/repository-manager';
import { AsyncStorageService } from './services/AsyncStorageService';
import { FileSystemService } from './services/FileSystemService';
import { NetworkService } from './services/NetworkService';
import { OBSRepositoryManager } from '@your-org/repository-manager';

// Create and configure the container
const container = createContainer();

// Bind your implementations
container.bind(TYPES.Storage).to(AsyncStorageService).inSingletonScope();
container.bind(TYPES.FileSystem).to(FileSystemService).inSingletonScope();
container.bind(TYPES.NetworkService).to(NetworkService).inSingletonScope();
container.bind(TYPES.RepositoryManager).to(OBSRepositoryManager).inSingletonScope();

// Use in your components
@injectable()
class YourComponent {
  constructor(
    @inject(TYPES.RepositoryManager) private repositoryManager: IRepositoryManager
  ) {}

  async loadRepositories() {
    const repos = await this.repositoryManager.getDownloadedRepositories();
    // Use the repositories...
  }
}
```

## Configuration

The library can be configured through the `IRepositoryConfig` interface:

```typescript
interface IRepositoryConfig {
  baseUrl: string;          // Base URL for API endpoints
  storageKey: string;       // Key for storing downloaded repos
  thumbnailsDir: string;    // Directory for storing thumbnails
  appDir: string;          // Base directory for app data
  timeout?: number;        // Request timeout in milliseconds
  retryAttempts?: number;  // Number of retry attempts
  retryDelay?: number;     // Delay between retries
}
```

Default configuration:
```typescript
const DEFAULT_CONFIG = {
  baseUrl: 'https://git.door43.org/api/v1',
  storageKey: '@obs_downloaded_repos',
  thumbnailsDir: 'thumbnails',
  appDir: 'obs-app',
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
};
```

## Core Interfaces

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

### Repository

The repository data structure:

```typescript
interface Repository {
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
```

## Testing

The library is designed to be easily testable. You can mock the dependencies using Inversify's container:

```typescript
import { Container } from 'inversify';
import { createContainer, TYPES } from '@your-org/repository-manager';
import { MockStorage } from './mocks/MockStorage';
import { MockFileSystem } from './mocks/MockFileSystem';
import { MockNetworkService } from './mocks/MockNetworkService';

describe('RepositoryManager', () => {
  let container: Container;
  let repositoryManager: IRepositoryManager;

  beforeEach(() => {
    container = createContainer();

    // Bind mock implementations
    container.bind(TYPES.Storage).to(MockStorage).inSingletonScope();
    container.bind(TYPES.FileSystem).to(MockFileSystem).inSingletonScope();
    container.bind(TYPES.NetworkService).to(MockNetworkService).inSingletonScope();
    container.bind(TYPES.RepositoryManager).to(OBSRepositoryManager).inSingletonScope();

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
