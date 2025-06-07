// AsyncStorage no longer needed - using query parameters instead
import * as FileSystem from 'expo-file-system';

/**
 * Minimal validation to check if a file could be an OBS file
 * Checks for ZIP signature without full file processing
 */
async function isValidObsFile(filePath: string): Promise<boolean> {
  try {
    let actualFilePath = filePath;

    // Handle content URIs by copying to cache first for validation
    if (filePath.startsWith('content://')) {
      try {
        const { StorageAccessFramework } = await import('expo-file-system');

        const tempFileName = `validate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.tmp`;
        const tempFilePath = `${FileSystem.cacheDirectory}${tempFileName}`;

        await StorageAccessFramework.copyAsync({
          from: filePath,
          to: tempFilePath,
        });

        actualFilePath = tempFilePath;
      } catch (copyError) {
        console.error('Error copying file:', copyError);
        return false;
      }
    }

    // Check if file exists and has content
    const fileInfo = await FileSystem.getInfoAsync(actualFilePath);
    if (!fileInfo.exists || fileInfo.size === 0) {
      return false;
    }

    // Check for ZIP file signature (PK\x03\x04)
    const fileContent = await FileSystem.readAsStringAsync(actualFilePath, {
      encoding: FileSystem.EncodingType.Base64,
      length: 4,
    });

    const signature = atob(fileContent).substring(0, 4);
    const isZip = signature === 'PK\x03\x04';

    // Clean up temp file
    if (filePath.startsWith('content://') && actualFilePath !== filePath) {
      try {
        await FileSystem.deleteAsync(actualFilePath, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    return isZip;
  } catch (error) {
    console.error('Error processing URL:', error);
    return false;
  }
}

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    console.log('🔍 redirectSystemPath', path);

    // Handle files with .obs extension (trusted)
    if (
      path &&
      (path.toLowerCase().endsWith('.obs') ||
        (path.startsWith('file://') && path.toLowerCase().endsWith('.obs')))
    ) {
      console.log('🎯 OBS file detected, redirecting to import');
      const encodedPath = encodeURIComponent(path);
      return `/(tabs)/(read)?importPath=${encodedPath}`;
    }

    // Handle content URIs (WhatsApp, downloads, etc.)
    if (path && path.startsWith('content://')) {
      console.log('🎯 Content URI detected, redirecting to import');

      // Validate asynchronously for logging purposes
      isValidObsFile(path).then((isValid) => {
        console.log(isValid ? '✅ Valid OBS file' : '❌ Not a valid OBS file');
      });

      const encodedPath = encodeURIComponent(path);
      return `/(tabs)/(read)?importPath=${encodedPath}`;
    }

    // Handle custom app scheme URLs
    if (path && path.startsWith('obs-app://')) {
      return path.replace('obs-app://', '/');
    }

    // No special handling needed
    return path;
  } catch (error) {
    console.error('Error processing URL:', error);
    return '/error-handling';
  }
}
