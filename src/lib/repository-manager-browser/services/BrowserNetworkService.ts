import { injectable } from 'inversify';
import { INetworkService } from '@your-org/repository-manager-core';

@injectable()
export class BrowserNetworkService implements INetworkService {
  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    try {
      const isConnected = await this.isOnline();
      if (!isConnected) {
        throw new Error('Network is offline');
      }

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      console.error('Error fetching from network:', error);
      throw error;
    }
  }
}
