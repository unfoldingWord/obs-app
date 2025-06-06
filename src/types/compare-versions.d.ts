declare module 'compare-versions' {
  /**
   * Compare two version strings
   * @param v1 First version string
   * @param v2 Second version string
   * @param options Optional comparison options
   * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  export function compareVersions(
    v1: string,
    v2: string,
    options?: {
      lexicographical?: boolean;
      zeroExtend?: boolean;
      loose?: boolean;
    }
  ): -1 | 0 | 1;
}
