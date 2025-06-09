import * as FileSystem from 'expo-file-system';
import { injectable } from 'inversify';

import { IFileSystem } from '@/interfaces/IFileSystem';

@injectable()
export class FileSystemService implements IFileSystem {
  get documentDirectory(): string {
    return FileSystem.documentDirectory;
  }

  async getInfoAsync(uri: string): Promise<{ exists: boolean }> {
    return FileSystem.getInfoAsync(uri);
  }

  async makeDirectoryAsync(uri: string, options?: { intermediates: boolean }): Promise<void> {
    await FileSystem.makeDirectoryAsync(uri, options);
  }

  async deleteAsync(uri: string, options?: { idempotent: boolean }): Promise<void> {
    await FileSystem.deleteAsync(uri, options);
  }

  async writeAsStringAsync(uri: string, content: string): Promise<void> {
    await FileSystem.writeAsStringAsync(uri, content);
  }

  async readAsStringAsync(uri: string): Promise<string> {
    return FileSystem.readAsStringAsync(uri);
  }

  async downloadAsync(uri: string, localUri: string): Promise<{ status: number }> {
    return FileSystem.downloadAsync(uri, localUri);
  }
}
