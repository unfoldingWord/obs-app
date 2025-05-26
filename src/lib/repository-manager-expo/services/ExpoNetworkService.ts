import * as Network from 'expo-network';
import { injectable } from 'inversify';
import { INetworkService } from '@your-org/repository-manager-core';

@injectable()
export class ExpoNetworkService implements INetworkService {
  async isOnline(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected ?? false;
    } catch (error) {
      console.error('Error checking network state:', error);
      return false;
    }
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
