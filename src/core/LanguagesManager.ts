import * as SQLite from 'expo-sqlite';

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
  hasCollections: boolean; // Whether we have downloaded collections in this language
}

export class LanguagesManager {
  private static instance: LanguagesManager;
  private db!: SQLite.SQLiteDatabase;
  private languages: Map<string, Language> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): LanguagesManager {
    if (!LanguagesManager.instance) {
      LanguagesManager.instance = new LanguagesManager();
    }
    return LanguagesManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('languages.db');
      await this.createTables();
      await this.loadLanguages();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize LanguagesManager:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS languages (
        lc TEXT PRIMARY KEY,
        ln TEXT NOT NULL,
        ang TEXT NOT NULL,
        ld TEXT NOT NULL DEFAULT 'ltr',
        gw INTEGER NOT NULL DEFAULT 0,
        hc TEXT NOT NULL DEFAULT '',
        lr TEXT NOT NULL DEFAULT '',
        pk INTEGER NOT NULL DEFAULT 0,
        alt TEXT NOT NULL DEFAULT '[]',
        cc TEXT NOT NULL DEFAULT '[]',
        last_updated TEXT NOT NULL,
        has_collections INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_languages_gw ON languages(gw);
      CREATE INDEX IF NOT EXISTS idx_languages_has_collections ON languages(has_collections);
      CREATE INDEX IF NOT EXISTS idx_languages_lr ON languages(lr);
    `);
  }

  private async loadLanguages(): Promise<void> {
    try {
      const rows = await this.db.getAllAsync<any>(
        'SELECT * FROM languages ORDER BY ln ASC'
      );

      this.languages.clear();
      for (const row of rows) {
        const language: Language = {
          lc: row.lc,
          ln: row.ln,
          ang: row.ang,
          ld: row.ld as 'ltr' | 'rtl',
          gw: Boolean(row.gw),
          hc: row.hc,
          lr: row.lr,
          pk: row.pk,
          alt: JSON.parse(row.alt),
          cc: JSON.parse(row.cc),
          lastUpdated: new Date(row.last_updated),
          hasCollections: Boolean(row.has_collections)
        };
        this.languages.set(language.lc, language);
      }
    } catch (error) {
      console.error('Error loading languages from database:', error);
    }
  }

  async saveLanguage(languageData: Partial<Language> & { lc: string }): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      const existingLanguage = this.languages.get(languageData.lc);
      const now = new Date().toISOString();

      const language: Language = {
        lc: languageData.lc,
        ln: languageData.ln || existingLanguage?.ln || languageData.lc,
        ang: languageData.ang || existingLanguage?.ang || languageData.lc,
        ld: languageData.ld || existingLanguage?.ld || 'ltr',
        gw: languageData.gw !== undefined ? languageData.gw : (existingLanguage?.gw || false),
        hc: languageData.hc || existingLanguage?.hc || '',
        lr: languageData.lr || existingLanguage?.lr || '',
        pk: languageData.pk || existingLanguage?.pk || 0,
        alt: languageData.alt || existingLanguage?.alt || [],
        cc: languageData.cc || existingLanguage?.cc || [],
        lastUpdated: new Date(now),
        hasCollections: languageData.hasCollections !== undefined ? languageData.hasCollections : (existingLanguage?.hasCollections || false)
      };

      await this.db.runAsync(
        `INSERT OR REPLACE INTO languages
         (lc, ln, ang, ld, gw, hc, lr, pk, alt, cc, last_updated, has_collections)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          language.lc,
          language.ln,
          language.ang,
          language.ld,
          language.gw ? 1 : 0,
          language.hc,
          language.lr,
          language.pk,
          JSON.stringify(language.alt),
          JSON.stringify(language.cc),
          now,
          language.hasCollections ? 1 : 0
        ]
      );

      this.languages.set(language.lc, language);
    } catch (error) {
      console.error('Error saving language:', error);
      throw error;
    }
  }

  async getLanguage(languageCode: string): Promise<Language | null> {
    if (!this.initialized) await this.initialize();
    return this.languages.get(languageCode) || null;
  }

  async getAllLanguages(): Promise<Language[]> {
    if (!this.initialized) await this.initialize();
    return Array.from(this.languages.values()).sort((a, b) => a.ln.localeCompare(b.ln));
  }

  async getLanguagesWithCollections(): Promise<Language[]> {
    if (!this.initialized) await this.initialize();
    return Array.from(this.languages.values())
      .filter(lang => lang.hasCollections)
      .sort((a, b) => a.ln.localeCompare(b.ln));
  }

  async getGatewayLanguages(): Promise<Language[]> {
    if (!this.initialized) await this.initialize();
    return Array.from(this.languages.values())
      .filter(lang => lang.gw)
      .sort((a, b) => a.ln.localeCompare(b.ln));
  }

  async markLanguageAsHavingCollections(languageCode: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.db.runAsync(
        'UPDATE languages SET has_collections = 1 WHERE lc = ?',
        [languageCode]
      );

      const language = this.languages.get(languageCode);
      if (language) {
        language.hasCollections = true;
        this.languages.set(languageCode, language);
      }
    } catch (error) {
      console.error('Error marking language as having collections:', error);
      throw error;
    }
  }

  async markLanguageAsNotHavingCollections(languageCode: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.db.runAsync(
        'UPDATE languages SET has_collections = 0 WHERE lc = ?',
        [languageCode]
      );

      const language = this.languages.get(languageCode);
      if (language) {
        language.hasCollections = false;
        this.languages.set(languageCode, language);
      }
    } catch (error) {
      console.error('Error marking language as not having collections:', error);
      throw error;
    }
  }

  async updateLanguageFromRemote(remoteLanguageData: any): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      const languageData: Partial<Language> & { lc: string } = {
        lc: remoteLanguageData.lc,
        ln: remoteLanguageData.ln,
        ang: remoteLanguageData.ang,
        ld: remoteLanguageData.ld || 'ltr',
        gw: remoteLanguageData.gw || false,
        hc: remoteLanguageData.hc || '',
        lr: remoteLanguageData.lr || '',
        pk: remoteLanguageData.pk || 0,
        alt: remoteLanguageData.alt || [],
        cc: remoteLanguageData.cc || []
      };

      await this.saveLanguage(languageData);
    } catch (error) {
      console.error('Error updating language from remote data:', error);
      throw error;
    }
  }

  async searchLanguages(query: string): Promise<Language[]> {
    if (!this.initialized) await this.initialize();

    const searchTerm = query.toLowerCase();
    return Array.from(this.languages.values())
      .filter(lang =>
        lang.ln.toLowerCase().includes(searchTerm) ||
        lang.ang.toLowerCase().includes(searchTerm) ||
        lang.lc.toLowerCase().includes(searchTerm) ||
        lang.alt.some(alt => alt.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => a.ln.localeCompare(b.ln));
  }

  async deleteLanguage(languageCode: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.db.runAsync('DELETE FROM languages WHERE lc = ?', [languageCode]);
      this.languages.delete(languageCode);
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

    const languages = Array.from(this.languages.values());
    return {
      total: languages.length,
      withCollections: languages.filter(lang => lang.hasCollections).length,
      gatewayLanguages: languages.filter(lang => lang.gw).length,
      rtlLanguages: languages.filter(lang => lang.ld === 'rtl').length
    };
  }
}
