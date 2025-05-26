import { Container } from 'inversify';
import { createContainer, TYPES } from '../container';
import { OBSRepositoryManager } from '../core/OBSRepositoryManager';
import { MockStorage } from './mocks/MockStorage';
import { MockFileSystem } from './mocks/MockFileSystem';
import { MockNetworkService } from './mocks/MockNetworkService';
import { Repository } from '../interfaces/Repository';

describe('OBSRepositoryManager', () => {
  let container: Container;
  let repositoryManager: OBSRepositoryManager;
  let mockStorage: MockStorage;
  let mockFileSystem: MockFileSystem;
  let mockNetwork: MockNetworkService;

  const mockRepo: Repository = {
    id: 'test-repo',
    owner: 'test-owner',
    language: 'en',
    displayName: 'Test Repository',
    description: 'A test repository',
    version: '1.0.0',
    lastUpdated: new Date(),
    isDownloaded: false,
    thumbnail: 'https://example.com/thumbnail.jpg',
  };

  beforeEach(() => {
    container = createContainer();

    // Bind mock implementations
    container.bind(TYPES.Storage).to(MockStorage).inSingletonScope();
    container.bind(TYPES.FileSystem).to(MockFileSystem).inSingletonScope();
    container.bind(TYPES.NetworkService).to(MockNetworkService).inSingletonScope();
    container.bind(TYPES.RepositoryManager).to(OBSRepositoryManager).inSingletonScope();

    repositoryManager = container.get(TYPES.RepositoryManager) as OBSRepositoryManager;
    mockStorage = container.get(TYPES.Storage) as MockStorage;
    mockFileSystem = container.get(TYPES.FileSystem) as MockFileSystem;
    mockNetwork = container.get(TYPES.NetworkService) as MockNetworkService;

    // Clear all mocks before each test
    mockStorage.clear();
    mockFileSystem.clear();
    mockNetwork.clearMockResponses();
  });

  describe('getRepository', () => {
    it('should return null when offline and repository not found locally', async () => {
      mockNetwork.setOnline(false);
      const repo = await repositoryManager.getRepository('test-owner', 'en', 'test-repo');
      expect(repo).toBeNull();
    });

    it('should return repository from network when online', async () => {
      const mockResponse = mockNetwork.createMockResponse({
        data: [{
          name: 'test-repo',
          owner: 'test-owner',
          language: 'en',
          title: 'Test Repository',
          repo: { description: 'A test repository' },
          release: { tag_name: '1.0.0', published_at: new Date().toISOString() },
        }],
      });
      mockNetwork.setMockResponse(
        'https://git.door43.org/api/v1/catalog/search?subject=Open%20Bible%20Stories&stage=prod&owner=test-owner&lang=en',
        mockResponse
      );

      const repo = await repositoryManager.getRepository('test-owner', 'en', 'test-repo');
      expect(repo).toEqual(expect.objectContaining({
        id: 'test-repo',
        owner: 'test-owner',
        language: 'en',
        displayName: 'Test Repository',
      }));
    });
  });

  describe('downloadRepository', () => {
    it('should throw error when repository not found', async () => {
      await expect(
        repositoryManager.downloadRepository('test-owner', 'en', 'non-existent-repo')
      ).rejects.toThrow('Repository not found');
    });

    it('should download and store repository when found', async () => {
      // Mock the repository search response
      const searchResponse = mockNetwork.createMockResponse({
        data: [{
          name: 'test-repo',
          owner: 'test-owner',
          language: 'en',
          title: 'Test Repository',
          repo: { description: 'A test repository' },
          release: { tag_name: '1.0.0', published_at: new Date().toISOString() },
        }],
      });
      mockNetwork.setMockResponse(
        'https://git.door43.org/api/v1/catalog/search?subject=Open%20Bible%20Stories&stage=prod&owner=test-owner&lang=en',
        searchResponse
      );

      // Mock the repository entry response
      const entryResponse = mockNetwork.createMockResponse({
        zipball_url: 'https://example.com/repo.zip',
      });
      mockNetwork.setMockResponse(
        'https://git.door43.org/api/v1/catalog/entry/test-owner/test-repo/master',
        entryResponse
      );

      // Mock the ZIP download response
      const zipResponse = mockNetwork.createMockResponse(new ArrayBuffer(0));
      mockNetwork.setMockResponse('https://example.com/repo.zip', zipResponse);

      await repositoryManager.downloadRepository('test-owner', 'en', 'test-repo');

      // Verify repository was marked as downloaded
      const isDownloaded = await repositoryManager.isRepositoryDownloaded('test-owner', 'en', 'test-repo');
      expect(isDownloaded).toBe(true);
    });
  });

  describe('deleteRepository', () => {
    it('should remove repository from downloaded list', async () => {
      // First download a repository
      const searchResponse = mockNetwork.createMockResponse({
        data: [{
          name: 'test-repo',
          owner: 'test-owner',
          language: 'en',
          title: 'Test Repository',
        }],
      });
      mockNetwork.setMockResponse(
        'https://git.door43.org/api/v1/catalog/search?subject=Open%20Bible%20Stories&stage=prod&owner=test-owner&lang=en',
        searchResponse
      );

      const entryResponse = mockNetwork.createMockResponse({
        zipball_url: 'https://example.com/repo.zip',
      });
      mockNetwork.setMockResponse(
        'https://git.door43.org/api/v1/catalog/entry/test-owner/test-repo/master',
        entryResponse
      );

      const zipResponse = mockNetwork.createMockResponse(new ArrayBuffer(0));
      mockNetwork.setMockResponse('https://example.com/repo.zip', zipResponse);

      await repositoryManager.downloadRepository('test-owner', 'en', 'test-repo');

      // Then delete it
      await repositoryManager.deleteRepository('test-owner', 'en', 'test-repo');

      // Verify repository was removed
      const isDownloaded = await repositoryManager.isRepositoryDownloaded('test-owner', 'en', 'test-repo');
      expect(isDownloaded).toBe(false);
    });
  });

  describe('getDownloadedRepositories', () => {
    it('should return empty array when no repositories are downloaded', async () => {
      const repos = await repositoryManager.getDownloadedRepositories();
      expect(repos).toEqual([]);
    });

    it('should return downloaded repositories', async () => {
      // Download a repository first
      const searchResponse = mockNetwork.createMockResponse({
        data: [{
          name: 'test-repo',
          owner: 'test-owner',
          language: 'en',
          title: 'Test Repository',
        }],
      });
      mockNetwork.setMockResponse(
        'https://git.door43.org/api/v1/catalog/search?subject=Open%20Bible%20Stories&stage=prod&owner=test-owner&lang=en',
        searchResponse
      );

      const entryResponse = mockNetwork.createMockResponse({
        zipball_url: 'https://example.com/repo.zip',
      });
      mockNetwork.setMockResponse(
        'https://git.door43.org/api/v1/catalog/entry/test-owner/test-repo/master',
        entryResponse
      );

      const zipResponse = mockNetwork.createMockResponse(new ArrayBuffer(0));
      mockNetwork.setMockResponse('https://example.com/repo.zip', zipResponse);

      await repositoryManager.downloadRepository('test-owner', 'en', 'test-repo');

      // Get downloaded repositories
      const repos = await repositoryManager.getDownloadedRepositories();
      expect(repos).toHaveLength(1);
      expect(repos[0]).toEqual(expect.objectContaining({
        id: 'test-repo',
        owner: 'test-owner',
        language: 'en',
        isDownloaded: true,
      }));
    });
  });
});
