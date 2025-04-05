import { warn } from './utils';

interface Repository {
  id: number;
  name: string;
  language: string;
  version: string;
  release: {
    tag_name: string;
    published_at: string;
  };
}

export class RepositoryManager {
  private static instance: RepositoryManager;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = 'https://git.door43.org/api/v1';
  }

  static getInstance(): RepositoryManager {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager();
    }
    return RepositoryManager.instance;
  }

  async searchRepositories(query: string, language?: string): Promise<Repository[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        ...(language && { language }),
      });

      const response = await fetch(`${this.baseUrl}/repos/search?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to search repositories: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      warn(`Error searching repositories: ${error}`);
      return [];
    }
  }

  async getRepositoryDetails(owner: string, repo: string): Promise<Repository | null> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`);
      if (!response.ok) {
        throw new Error(`Failed to get repository details: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      warn(`Error getting repository details: ${error}`);
      return null;
    }
  }
}
