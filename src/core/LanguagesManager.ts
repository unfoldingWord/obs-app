import { DatabaseManager } from './DatabaseManager';

export interface Language {
  lc: string; // Language code (ISO 639-3 code) - Primary key
  ln: string; // Native name of the language
  ang: string; // English name of the language
  ld: 'ltr' | 'rtl'; // Text direction (left-to-right or right-to-left)
  gw: boolean; // Whether this is a Gateway language
  hc: string; // Home country code
  lr: string; // Language region
  pk: number; // Primary key from Door43 catalog
  alt: string[]; // Alternative names for the language
  cc: string[]; // Country codes where this language is spoken
  lastUpdated: Date; // When this language data was last updated
}

export class LanguagesManager {
  private static instance: LanguagesManager;
  private databaseManager: DatabaseManager;
  private initialized: boolean = false;

  private constructor() {
    this.databaseManager = DatabaseManager.getInstance();
  }

  static getInstance(): LanguagesManager {
    if (!LanguagesManager.instance) {
      LanguagesManager.instance = new LanguagesManager();
    }
    return LanguagesManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.databaseManager.initialize();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize LanguagesManager:', error);
      throw error;
    }
  }

  private convertFromDb(dbLanguage: any): Language {
    return {
      lc: dbLanguage.lc,
      ln: dbLanguage.ln,
      ang: dbLanguage.ang,
      ld: dbLanguage.ld as 'ltr' | 'rtl',
      gw: dbLanguage.gw,
      hc: dbLanguage.hc,
      lr: dbLanguage.lr,
      pk: dbLanguage.pk,
      alt: dbLanguage.alt,
      cc: dbLanguage.cc,
      lastUpdated: new Date(dbLanguage.lastUpdated),
    };
  }

  private convertToDb(language: Partial<Language> & { lc: string }) {
    return {
      lc: language.lc,
      ln: language.ln || language.lc,
      ang: language.ang || language.lc,
      ld: language.ld || 'ltr',
      gw: language.gw || false,
      hc: language.hc || '',
      lr: language.lr || '',
      pk: language.pk || 0,
      alt: language.alt || [],
      cc: language.cc || [],
      lastUpdated: language.lastUpdated?.toISOString() || new Date().toISOString(),
    };
  }

  async saveLanguage(languageData: Partial<Language> & { lc: string }): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      const dbLanguageData = this.convertToDb(languageData);
      await this.databaseManager.saveLanguage(dbLanguageData);
    } catch (error) {
      console.error('Error saving language:', error);
      throw error;
    }
  }

  async getLanguage(languageCode: string): Promise<Language | null> {
    if (!this.initialized) await this.initialize();

    const dbLanguage = await this.databaseManager.getLanguage(languageCode);
    return dbLanguage ? this.convertFromDb(dbLanguage) : null;
  }

  async getAllLanguages(): Promise<Language[]> {
    if (!this.initialized) await this.initialize();

    const dbLanguages = await this.databaseManager.getAllLanguages();
    return dbLanguages.map(lang => this.convertFromDb(lang));
  }

  async getLanguagesWithCollections(): Promise<Language[]> {
    if (!this.initialized) await this.initialize();

    const dbLanguages = await this.databaseManager.getLanguagesWithCollections();
    return dbLanguages.map(lang => this.convertFromDb(lang));
  }

  async getGatewayLanguages(): Promise<Language[]> {
    if (!this.initialized) await this.initialize();

    const dbLanguages = await this.databaseManager.getGatewayLanguages();
    return dbLanguages.map(lang => this.convertFromDb(lang));
  }

  async markLanguageAsHavingCollections(languageCode: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.databaseManager.markLanguageAsHavingCollections(languageCode, true);
    } catch (error) {
      console.error('Error marking language as having collections:', error);
      throw error;
    }
  }

  async markLanguageAsNotHavingCollections(languageCode: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.databaseManager.markLanguageAsHavingCollections(languageCode, false);
    } catch (error) {
      console.error('Error marking language as not having collections:', error);
      throw error;
    }
  }

  async updateLanguageFromRemote(remoteLanguageData: any): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.saveLanguage(remoteLanguageData);
    } catch (error) {
      console.error('Error updating language from remote:', error);
      throw error;
    }
  }

  async searchLanguages(query: string): Promise<Language[]> {
    if (!this.initialized) await this.initialize();

    const dbLanguages = await this.databaseManager.searchLanguages(query);
    return dbLanguages.map(lang => this.convertFromDb(lang));
  }

  async deleteLanguage(languageCode: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.databaseManager.deleteLanguage(languageCode);
    } catch (error) {
      console.error('Error deleting language:', error);
      throw error;
    }
  }

  async getLanguageStats(): Promise<{
    total: number;
    withCollections: number;
    gatewayLanguages: number;
    rtlLanguages: number;
  }> {
    if (!this.initialized) await this.initialize();

    return await this.databaseManager.getLanguageStats();
  }
}
