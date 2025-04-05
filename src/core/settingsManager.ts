import AsyncStorage from '@react-native-async-storage/async-storage';
import { warn } from './utils';

interface AppSettings {
  language: string;
  imageResolution: 'low' | 'medium' | 'high';
  autoDownloadImages: boolean;
  darkMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  imageResolution: 'medium',
  autoDownloadImages: true,
  darkMode: false,
};

export class SettingsManager {
  private static instance: SettingsManager;
  private static STORAGE_KEY = '@obs_reader_settings';

  private constructor() {}

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await AsyncStorage.getItem(SettingsManager.STORAGE_KEY);
      return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
    } catch (error) {
      warn(`Error getting settings: ${error}`);
      return DEFAULT_SETTINGS;
    }
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(
        SettingsManager.STORAGE_KEY,
        JSON.stringify(newSettings)
      );
    } catch (error) {
      warn(`Error updating settings: ${error}`);
    }
  }

  async resetSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SettingsManager.STORAGE_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
      );
    } catch (error) {
      warn(`Error resetting settings: ${error}`);
    }
  }
}
