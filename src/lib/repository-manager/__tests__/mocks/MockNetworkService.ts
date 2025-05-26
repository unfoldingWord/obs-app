import { injectable } from 'inversify';
import { INetworkService } from '../../interfaces/INetworkService';

@injectable()
export class MockNetworkService implements INetworkService {
  private isOnlineValue: boolean = true;
  private mockResponses: Map<string, Response> = new Map();

  async isOnline(): Promise<boolean> {
    return this.isOnlineValue;
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    if (!this.isOnlineValue) {
      throw new Error('Network is offline');
    }

    const mockResponse = this.mockResponses.get(url);
    if (mockResponse) {
      return mockResponse;
    }

    // Default response for unknown URLs
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Helper methods for testing
  setOnline(online: boolean): void {
    this.isOnlineValue = online;
  }

  setMockResponse(url: string, response: Response): void {
    this.mockResponses.set(url, response);
  }

  clearMockResponses(): void {
    this.mockResponses.clear();
  }

  // Helper to create a mock response
  createMockResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
