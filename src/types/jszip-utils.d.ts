declare module 'jszip-utils' {
  /**
   * Gets binary content from a URL
   * @param url The URL to fetch content from
   * @param callback Optional callback function
   * @returns A promise that resolves with the binary content
   */
  export function getBinaryContent(
    url: string,
    callback?: (err: Error | null, data: any) => void
  ): Promise<any>;
}
