# Repository Manager Expo

A React Native/Expo implementation of the Repository Manager Core library. This package provides platform-specific implementations of the core interfaces using Expo's APIs.

## Features

- 📱 Expo-specific implementations
- 🔄 AsyncStorage integration
- 📂 FileSystem integration
- 🌐 Network connectivity
- 🧩 Easy integration with Expo apps

## Installation

```bash
npm install @your-org/repository-manager-expo @your-org/repository-manager-core
```

## Usage

```typescript
import { Container } from 'inversify';
import { createContainer, TYPES } from '@your-org/repository-manager-core';
import { ExpoStorageService } from '@your-org/repository-manager-expo';
import { ExpoFileSystemService } from '@your-org/repository-manager-expo';
import { ExpoNetworkService } from '@your-org/repository-manager-expo';
import { ExpoRepositoryManager } from '@your-org/repository-manager-expo';

// Create and configure the container
const container = createContainer();

// Bind Expo-specific implementations
container.bind(TYPES.Storage).to(ExpoStorageService).inSingletonScope();
container.bind(TYPES.FileSystem).to(ExpoFileSystemService).inSingletonScope();
container.bind(TYPES.NetworkService).to(ExpoNetworkService).inSingletonScope();
container.bind(TYPES.RepositoryManager).to(ExpoRepositoryManager).inSingletonScope();

// Use in your Expo app
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

## Expo Services

### ExpoStorageService

Uses Expo's AsyncStorage for persistent storage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { injectable } from 'inversify';
import { IStorage } from '@your-org/repository-manager-core';

@injectable()
export class ExpoStorageService implements IStorage {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}
```

### ExpoFileSystemService

Uses Expo's FileSystem for file operations:

```typescript
import * as FileSystem from 'expo-file-system';
import { injectable } from 'inversify';
import { IFileSystem } from '@your-org/repository-manager-core';

@injectable()
export class ExpoFileSystemService implements IFileSystem {
  public documentDirectory: string = FileSystem.documentDirectory!;

  async getInfoAsync(uri: string): Promise<{ exists: boolean }> {
    const info = await FileSystem.getInfoAsync(uri);
    return { exists: info.exists };
  }

  async makeDirectoryAsync(uri: string, options?: { intermediates: boolean }): Promise<void> {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: options?.intermediates });
  }

  async deleteAsync(uri: string, options?: { idempotent: boolean }): Promise<void> {
    await FileSystem.deleteAsync(uri, { idempotent: options?.idempotent });
  }

  async writeAsStringAsync(uri: string, content: string): Promise<void> {
    await FileSystem.writeAsStringAsync(uri, content);
  }

  async readAsStringAsync(uri: string): Promise<string> {
    return FileSystem.readAsStringAsync(uri);
  }

  async downloadAsync(uri: string, localUri: string): Promise<{ status: number }> {
    const result = await FileSystem.downloadAsync(uri, localUri);
    return { status: result.status };
  }
}
```

### ExpoNetworkService

Uses Expo's Network module for connectivity and fetch:

```typescript
import * as Network from 'expo-network';
import { injectable } from 'inversify';
import { INetworkService } from '@your-org/repository-manager-core';

@injectable()
export class ExpoNetworkService implements INetworkService {
  async isOnline(): Promise<boolean> {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected ?? false;
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    return fetch(url, options);
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
