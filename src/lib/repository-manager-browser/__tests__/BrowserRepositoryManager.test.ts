import { Container } from 'inversify';
import { TYPES, IRepositoryManager, IRepositoryConfig } from '@your-org/repository-manager-core';
import { createBrowserContainer } from '../container';
import { BrowserFileSystemService } from '../services/BrowserFileSystemService';

describe('BrowserRepositoryManager', () => {
  let container: Container;
  let repositoryManager: IRepositoryManager;
  let fileSystem: BrowserFileSystemService;

  beforeEach(() => {
    container = createBrowserContainer();

    // Configure the repository manager
    container.bind<IRepositoryConfig>(TYPES.IRepositoryConfig).toConstantValue({
      storageKey: 'test_downloaded_repos',
      baseUrl: 'https://api.example.com',
      thumbnailPath: 'thumbnails',
      contentPath: 'content'
    });

    repositoryManager = container.get<IRepositoryManager>(TYPES.IRepositoryManager);
    fileSystem = container.get<BrowserFileSystemService>(TYPES.IFileSystem);

    // Clear the file system before each test
    fileSystem.clear();
  });

  it('should initialize successfully', async () => {
    await expect(repositoryManager.initialize()).resolves.not.toThrow();
  });

  it('should download and store a repository', async () => {
    // Mock the network response
    const mockRepo = {
      id: 'test-repo',
      owner: 'test-owner',
      language: 'en',
      displayName: 'Test Repository',
      description: 'A test repository',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      thumbnail: 'https://example.com/thumbnail.jpg',
      isDownloaded: false
    };

    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('test-repo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRepo)
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('test content')
      });
    });

    await repositoryManager.initialize();
    await repositoryManager.downloadRepository('test-repo');

    const downloadedRepos = await repositoryManager.getDownloadedRepositories();
    expect(downloadedRepos).toHaveLength(1);
    expect(downloadedRepos[0].id).toBe('test-repo');
    expect(downloadedRepos[0].isDownloaded).toBe(true);
  });

  it('should delete a downloaded repository', async () => {
    // First download a repository
    const mockRepo = {
      id: 'test-repo',
      owner: 'test-owner',
      language: 'en',
      displayName: 'Test Repository',
      description: 'A test repository',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      thumbnail: 'https://example.com/thumbnail.jpg',
      isDownloaded: false
    };

    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('test-repo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRepo)
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('test content')
      });
    });

    await repositoryManager.initialize();
    await repositoryManager.downloadRepository('test-repo');

    // Then delete it
    await repositoryManager.deleteRepository('test-repo');

    const downloadedRepos = await repositoryManager.getDownloadedRepositories();
    expect(downloadedRepos).toHaveLength(0);
  });

  it('should check for repository updates', async () => {
    // First download a repository
    const mockRepo = {
      id: 'test-repo',
      owner: 'test-owner',
      language: 'en',
      displayName: 'Test Repository',
      description: 'A test repository',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      thumbnail: 'https://example.com/thumbnail.jpg',
      isDownloaded: false
    };

    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('test-repo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockRepo,
            version: url.includes('latest') ? '2.0.0' : '1.0.0'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('test content')
      });
    });

    await repositoryManager.initialize();
    await repositoryManager.downloadRepository('test-repo');

    const hasUpdates = await repositoryManager.hasRepositoryUpdates('test-repo');
    expect(hasUpdates).toBe(true);
  });
});
