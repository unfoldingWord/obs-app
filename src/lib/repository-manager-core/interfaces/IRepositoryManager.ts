import { IStorage } from './IStorage';
import { IFileSystem } from './IFileSystem';
import { INetworkService } from './INetworkService';

export interface Repository {
  id: string;
  owner: string;
  language: string;
  displayName: string;
  description: string;
  version: string;
  lastUpdated: string;
  thumbnail?: string;
  isDownloaded: boolean;
}

export interface IRepositoryConfig {
  storageKey: string;
  baseUrl: string;
  thumbnailPath: string;
  contentPath: string;
}

export interface IRepositoryManager {
  initialize(): Promise<void>;
  getRepository(id: string): Promise<Repository | null>;
  searchRepositories(language?: string): Promise<Repository[]>;
  downloadRepository(id: string): Promise<void>;
  deleteRepository(id: string): Promise<void>;
  getDownloadedRepositories(): Promise<Repository[]>;
  hasRepositoryUpdates(id: string): Promise<boolean>;
}
