import { injectable } from 'inversify';
import { IStorage } from '../../interfaces/IStorage';

@injectable()
export class MockStorage implements IStorage {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  // Helper method to clear all stored data
  clear(): void {
    this.storage.clear();
  }

  // Helper method to get all stored data
  getAll(): Map<string, string> {
    return new Map(this.storage);
  }
}
