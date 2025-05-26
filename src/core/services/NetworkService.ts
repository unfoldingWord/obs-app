import { injectable } from 'inversify';
import { INetworkService } from '../interfaces/INetworkService';

@injectable()
export class NetworkService implements INetworkService {
  async isOnline(): Promise<boolean> {
    try {
      // Create a timeout of 5 seconds
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 5000);
      });

      // The actual fetch request
      const fetchPromise = fetch('https://git.door43.org/api/v1/version', {
        method: 'HEAD',
      });

      // Race between timeout and fetch
      const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response;
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    return fetch(url, options);
  }
}
