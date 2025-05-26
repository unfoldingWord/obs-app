export interface IFileSystem {
  getInfoAsync(uri: string): Promise<{ exists: boolean }>;
  makeDirectoryAsync(uri: string, options?: { intermediates: boolean }): Promise<void>;
  deleteAsync(uri: string, options?: { idempotent: boolean }): Promise<void>;
  writeAsStringAsync(uri: string, content: string): Promise<void>;
  readAsStringAsync(uri: string): Promise<string>;
  downloadAsync(uri: string, localUri: string): Promise<{ status: number }>;
  documentDirectory: string;
}
