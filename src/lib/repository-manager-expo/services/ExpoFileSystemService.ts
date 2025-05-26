import * as FileSystem from 'expo-file-system';
import { injectable } from 'inversify';
import { IFileSystem } from '@your-org/repository-manager-core';

@injectable()
export class ExpoFileSystemService implements IFileSystem {
  readonly documentDirectory: string = FileSystem.documentDirectory!;

  async getInfoAsync(uri: string): Promise<{ exists: boolean; isDirectory: boolean }> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return {
        exists: info.exists,
        isDirectory: info.isDirectory ?? false
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return { exists: false, isDirectory: false };
    }
  }

  async makeDirectoryAsync(uri: string, options?: { intermediates: boolean }): Promise<void> {
    try {
      await FileSystem.makeDirectoryAsync(uri, {
        intermediates: options?.intermediates ?? false
      });
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  }

  async deleteAsync(uri: string, options?: { idempotent: boolean }): Promise<void> {
    try {
      await FileSystem.deleteAsync(uri, {
        idempotent: options?.idempotent ?? false
      });
    } catch (error) {
      console.error('Error deleting file/directory:', error);
      throw error;
    }
  }

  async writeAsStringAsync(uri: string, contents: string): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(uri, contents);
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  async readAsStringAsync(uri: string): Promise<string> {
    try {
      return await FileSystem.readAsStringAsync(uri);
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  async downloadAsync(uri: string, fileUri: string): Promise<void> {
    try {
      const downloadResult = await FileSystem.downloadAsync(uri, fileUri);
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
}
