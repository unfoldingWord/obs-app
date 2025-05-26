import { injectable } from 'inversify';
import { IFileSystem } from '@your-org/repository-manager-core';

@injectable()
export class BrowserFileSystemService implements IFileSystem {
  readonly documentDirectory: string = '/';

  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  async getInfoAsync(uri: string): Promise<{ exists: boolean; isDirectory: boolean }> {
    const isDirectory = this.directories.has(uri);
    const exists = isDirectory || this.files.has(uri);
    return { exists, isDirectory };
  }

  async makeDirectoryAsync(uri: string, options?: { intermediates: boolean }): Promise<void> {
    if (options?.intermediates) {
      const parts = uri.split('/').filter(Boolean);
      let currentPath = '';
      for (const part of parts) {
        currentPath += '/' + part;
        this.directories.add(currentPath);
      }
    } else {
      this.directories.add(uri);
    }
  }

  async deleteAsync(uri: string, options?: { idempotent: boolean }): Promise<void> {
    const info = await this.getInfoAsync(uri);
    if (!info.exists && !options?.idempotent) {
      throw new Error(`Path does not exist: ${uri}`);
    }

    if (info.isDirectory) {
      this.directories.delete(uri);
      // Delete all files and subdirectories
      for (const file of this.files.keys()) {
        if (file.startsWith(uri)) {
          this.files.delete(file);
        }
      }
      for (const dir of this.directories) {
        if (dir.startsWith(uri)) {
          this.directories.delete(dir);
        }
      }
    } else {
      this.files.delete(uri);
    }
  }

  async writeAsStringAsync(uri: string, contents: string): Promise<void> {
    const dirPath = uri.substring(0, uri.lastIndexOf('/'));
    if (dirPath) {
      await this.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    this.files.set(uri, contents);
  }

  async readAsStringAsync(uri: string): Promise<string> {
    const contents = this.files.get(uri);
    if (contents === undefined) {
      throw new Error(`File not found: ${uri}`);
    }
    return contents;
  }

  async downloadAsync(uri: string, fileUri: string): Promise<void> {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      const contents = await response.text();
      await this.writeAsStringAsync(fileUri, contents);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
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
