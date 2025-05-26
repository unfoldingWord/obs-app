import { Repository } from './Repository';

export interface IRepositoryManager {
  /**
   * Get a repository by its owner, language, and ID
   */
  getRepository(owner: string, language: string, repositoryId: string): Promise<Repository | null>;

  /**
   * Search for repositories, optionally filtered by language
   */
  searchRepositories(language?: string): Promise<Repository[]>;

  /**
   * Download a repository
   */
  downloadRepository(
    owner: string,
    language: string,
    repositoryId: string,
    version?: string
  ): Promise<void>;

  /**
   * Delete a downloaded repository
   */
  deleteRepository(owner: string, language: string, repositoryId: string): Promise<void>;

  /**
   * Get all downloaded repositories
   */
  getDownloadedRepositories(): Promise<Repository[]>;

  /**
   * Check if a repository has updates available
   */
  hasRepositoryUpdates(owner: string, language: string, repositoryId: string): Promise<boolean>;

  /**
   * Get the local path for a repository
   */
  getRepositoryPath(owner: string, language: string, repositoryId: string): string;

  /**
   * Get the local path for a repository's thumbnail
   */
  getThumbnailPath(owner: string, language: string, repositoryId: string): string;

  /**
   * Check if a repository is downloaded
   */
  isRepositoryDownloaded(owner: string, language: string, repositoryId: string): Promise<boolean>;
}
