export interface IFileSystem {
  readonly documentDirectory: string;

  getInfoAsync(uri: string): Promise<{ exists: boolean; isDirectory: boolean }>;
  makeDirectoryAsync(uri: string, options?: { intermediates: boolean }): Promise<void>;
  deleteAsync(uri: string, options?: { idempotent: boolean }): Promise<void>;
  writeAsStringAsync(uri: string, contents: string): Promise<void>;
  readAsStringAsync(uri: string): Promise<string>;
  downloadAsync(uri: string, fileUri: string): Promise<void>;
}
