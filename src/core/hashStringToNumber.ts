// Hash function to generate a number from 1 to 50 based on a string
export function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive number between 1 and 50
  return Math.abs(hash % 50) + 2;
}
