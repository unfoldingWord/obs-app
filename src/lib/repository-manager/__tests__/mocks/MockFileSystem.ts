import { injectable } from 'inversify';
import { IFileSystem } from '../../interfaces/IFileSystem';

@injectable()
export class MockFileSystem implements IFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();
  public documentDirectory: string = '/mock/document/directory/';

  async getInfoAsync(uri: string): Promise<{ exists: boolean }> {
    return {
      exists: this.files.has(uri) || this.directories.has(uri),
    };
  }

  async makeDirectoryAsync(uri: string, options?: { intermediates: boolean }): Promise<void> {
    if (options?.intermediates) {
      const parts = uri.split('/').filter(Boolean);
      let currentPath = '';
      for (const part of parts) {
        currentPath += `/${part}`;
        this.directories.add(currentPath);
      }
    } else {
      this.directories.add(uri);
    }
  }

  async deleteAsync(uri: string, options?: { idempotent: boolean }): Promise<void> {
    if (options?.idempotent && !this.files.has(uri) && !this.directories.has(uri)) {
      return;
    }
    this.files.delete(uri);
    this.directories.delete(uri);
  }

  async writeAsStringAsync(uri: string, content: string): Promise<void> {
    this.files.set(uri, content);
  }

  async readAsStringAsync(uri: string): Promise<string> {
    const content = this.files.get(uri);
    if (!content) {
      throw new Error(`File not found: ${uri}`);
    }
    return content;
  }

  async downloadAsync(uri: string, localUri: string): Promise<{ status: number }> {
    // Simulate a successful download
    this.files.set(localUri, 'mock downloaded content');
    return { status: 200 };
  }

  // Helper methods for testing
  clear(): void {
    this.files.clear();
    this.directories.clear();
  }

  getAllFiles(): Map<string, string> {
    return new Map(this.files);
  }

  getAllDirectories(): Set<string> {
    return new Set(this.directories);
  }
}
