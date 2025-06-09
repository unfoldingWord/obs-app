import { DatabaseManager } from './DatabaseManager';

import type { Language } from '@/db/schema';

export interface LanguageCompatible {
  lc: string;
  ln: string;
  ang: string;
  ld: 'ltr' | 'rtl';
  gw: boolean;
  hc: string;
  lr: string;
  pk: number;
  alt: string[];
  cc: string[];
  lastUpdated: Date;
}

export class UnifiedLanguagesManager {
  private static instance: UnifiedLanguagesManager;
  private databaseManager: DatabaseManager;

  private constructor() {
    this.databaseManager = DatabaseManager.getInstance();
  }

  static getInstance(): UnifiedLanguagesManager {
    if (!UnifiedLanguagesManager.instance) {
      UnifiedLanguagesManager.instance = new UnifiedLanguagesManager();
    }
    return UnifiedLanguagesManager.instance;
  }

  async initialize(): Promise<void> {
    await this.databaseManager.initialize();
  }

  private languageToCompatible(language: Language): LanguageCompatible {
    return {
      ...language,
      ld: language.ld as 'ltr' | 'rtl',
      lastUpdated: new Date(language.lastUpdated),
    };
  }

  private compatibleToNew(languageData: Partial<LanguageCompatible> & { lc: string }) {
    const existingLanguage = languageData as LanguageCompatible;
    return {
      lc: languageData.lc,
      ln: languageData.ln || existingLanguage?.ln || languageData.lc,
      ang: languageData.ang || existingLanguage?.ang || languageData.lc,
      ld: languageData.ld || 'ltr',
      gw: languageData.gw || false,
      hc: languageData.hc || '',
      lr: languageData.lr || '',
      pk: languageData.pk || 0,
      alt: languageData.alt || [],
      cc: languageData.cc || [],
      lastUpdated: languageData.lastUpdated?.toISOString() || new Date().toISOString(),
    };
  }

  async saveLanguage(languageData: Partial<LanguageCompatible> & { lc: string }): Promise<void> {
    const newLanguageData = this.compatibleToNew(languageData);
    await this.databaseManager.saveLanguage(newLanguageData);
  }

  async getLanguage(languageCode: string): Promise<LanguageCompatible | null> {
    const language = await this.databaseManager.getLanguage(languageCode);
    return language ? this.languageToCompatible(language) : null;
  }

  async getAllLanguages(): Promise<LanguageCompatible[]> {
    const languages = await this.databaseManager.getAllLanguages();
    return languages.map((lang) => this.languageToCompatible(lang));
  }

  async getLanguagesWithCollections(): Promise<LanguageCompatible[]> {
    const languages = await this.databaseManager.getLanguagesWithCollections();
    return languages.map((lang) => this.languageToCompatible(lang));
  }

  async getGatewayLanguages(): Promise<LanguageCompatible[]> {
    const languages = await this.databaseManager.getGatewayLanguages();
    return languages.map((lang) => this.languageToCompatible(lang));
  }

  async markLanguageAsHavingCollections(languageCode: string): Promise<void> {
    await this.databaseManager.markLanguageAsHavingCollections(languageCode, true);
  }

  async markLanguageAsNotHavingCollections(languageCode: string): Promise<void> {
    await this.databaseManager.markLanguageAsHavingCollections(languageCode, false);
  }

  async updateLanguageFromRemote(remoteLanguageData: any): Promise<void> {
    await this.saveLanguage(remoteLanguageData);
  }

  async searchLanguages(query: string): Promise<LanguageCompatible[]> {
    const languages = await this.databaseManager.searchLanguages(query);
    return languages.map((lang) => this.languageToCompatible(lang));
  }

  async deleteLanguage(languageCode: string): Promise<void> {
    await this.databaseManager.deleteLanguage(languageCode);
  }

  async getLanguageStats(): Promise<{
    total: number;
    withCollections: number;
    gatewayLanguages: number;
    rtlLanguages: number;
  }> {
    return await this.databaseManager.getLanguageStats();
  }
}

export default UnifiedLanguagesManager;
