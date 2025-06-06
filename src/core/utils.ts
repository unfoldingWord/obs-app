/**
 * Application-wide utility functions
 */

/**
 * Pads a number with leading zeros to ensure it's at least 2 digits
 * @param num - The number to pad
 * @returns A string with the padded number
 */
export function pad(num: number | string): string {
  return String(num).padStart(2, '0');
}

/**
 * Log a warning message to the console
 * @param message The warning message to log
 */
export function warn(message: string): void {
  console.warn(`[Warning]: ${message}`);
}

/**
 * Log an error message to the console
 * @param error The error object or message to log
 * @param context Optional context to provide with the error
 */
export function logError(error: unknown, context?: string): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Error]${context ? ` [${context}]` : ''}: ${message}`);
}

/**
 * Simple debounce function to limit how often a function can be called
 * @param func The function to debounce
 * @param wait The number of milliseconds to wait before allowing the function to be called again
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = null;
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Format a date to a readable string
 * @param date The date to format
 * @param format The format to use (defaults to 'YYYY-MM-DD')
 * @returns A formatted date string
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day);
}

/**
 * Truncate a string if it's longer than the specified length
 * @param str The string to truncate
 * @param length The maximum length of the string
 * @param ending The ending to append to the truncated string (defaults to '...')
 * @returns The truncated string
 */
export function truncate(str: string, length: number, ending: string = '...'): string {
  if (str.length <= length) {
    return str;
  }

  return str.substring(0, length - ending.length) + ending;
}

/**
 * Generate a random ID
 * @param length The length of the ID (defaults to 8)
 * @returns A random ID string
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Check if a URL is valid
 * @param url The URL to check
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms The number of milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format a story ID with leading zeros
 *
 * @param id The numeric ID to format
 * @returns Formatted ID with leading zeros (e.g. "01")
 */
export function formatStoryId(id: number | string): string {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  return String(numericId).padStart(2, '0');
}

/**
 * Clamp a number between a minimum and maximum value
 *
 * @param value The value to clamp
 * @param min The minimum value
 * @param max The maximum value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Parse a URL query string into an object
 *
 * @param queryString The query string to parse
 * @returns Object with the parsed parameters
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};

  if (!queryString || queryString.length === 0) {
    return params;
  }

  const searchParams = new URLSearchParams(
    queryString.startsWith('?') ? queryString.substring(1) : queryString
  );

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Truncate a string to a maximum length
 *
 * @param str The string to truncate
 * @param maxLength The maximum length
 * @param suffix Optional suffix to add when truncated (default: "...")
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength - suffix.length) + suffix;
}
