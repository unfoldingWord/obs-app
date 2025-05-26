import { injectable } from 'inversify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IStorage } from '../interfaces/IStorage';

@injectable()
export class AsyncStorageService implements IStorage {
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
