import { Repository } from './Repository';

export interface IRepositoryService {
  getRepository(owner: string, language: string, repositoryId: string): Promise<Repository | null>;
  searchRepositories(language?: string): Promise<Repository[]>;
  downloadRepository(
    owner: string,
    language: string,
    repositoryId: string,
    version?: string
  ): Promise<void>;
  deleteRepository(owner: string, language: string, repositoryId: string): Promise<void>;
  getDownloadedRepositories(): Promise<Repository[]>;
  hasRepositoryUpdates(owner: string, language: string, repositoryId: string): Promise<boolean>;
}
