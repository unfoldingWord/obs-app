// AsyncStorage no longer needed - using query parameters instead

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    // Check if it's an OBS file
    const isObsFile =
      path &&
      (path.toLowerCase().endsWith('.obs') ||
        (path.startsWith('content://') && path.toLowerCase().includes('.obs')));

    if (isObsFile) {
      // Encode the file path to safely pass it as a query parameter
      const encodedPath = encodeURIComponent(path);
      const targetRoute = `/(tabs)/(read)?importPath=${encodedPath}`;

      // Redirect to the read tab with the file path as a query parameter
      return targetRoute;
    }

    // Check for other custom URL schemes or patterns here if needed
    if (path && path.startsWith('obs-app://')) {
      // Handle custom app scheme URLs
      return path.replace('obs-app://', '/');
    }

    // Return the original path if no special handling is needed
    return path;
  } catch (error) {
    console.error('Error processing URL:', error);

    // Redirect to a safe error handling route
    return '/error-handling';
  }
}
