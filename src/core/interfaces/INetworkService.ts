export interface INetworkService {
  isOnline(): Promise<boolean>;
  fetch(url: string, options?: RequestInit): Promise<Response>;
}
