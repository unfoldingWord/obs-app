import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { CollectionImportExportManager } from '../core/CollectionImportExportManager';

export interface StorageLocation {
  name: string;
  path: string;
  type: 'internal' | 'external';
  icon: string;
}

export interface ImportableCollection {
  fileName: string;
  filePath: string;
  displayInfo: {
    collectionName: string;
    ownerName: string;
    version: string;
    language: string;
    storyCount: number;
    exportDate: string;
  };
  storageLocation: StorageLocation;
}

/**
 * Get all available storage locations including internal and custom directories
 */
export const getStorageLocations = async (): Promise<StorageLocation[]> => {
  const locations: StorageLocation[] = [];

  // Add internal storage
  const internalPath = `${FileSystem.documentDirectory}obs-app/exports/`;
  locations.push({
    name: 'Internal Storage',
    path: internalPath,
    type: 'internal',
    icon: 'phone-android',
  });

  try {
    // Add custom directory if previously selected during export
    const customExportUri = await AsyncStorage.getItem('@custom_export_directory');
    if (customExportUri) {
      locations.push({
        name: 'Custom Export Location',
        path: customExportUri,
        type: 'external',
        icon: 'folder-open',
      });
    }
  } catch (error) {
    console.warn('Failed to get custom export directory:', error);
  }

  try {
    // Add custom directory if previously selected during import
    const customImportUri = await AsyncStorage.getItem('@custom_import_directory');
    if (customImportUri) {
      // Check if this URI is already added as export location
      const alreadyExists = locations.some((loc) => loc.path === customImportUri);
      if (!alreadyExists) {
        locations.push({
          name: 'Custom Import Location',
          path: customImportUri,
          type: 'external',
          icon: 'folder-special',
        });
      }
    }
  } catch (error) {
    console.warn('Failed to get custom import directory:', error);
  }

  // Deduplicate locations by path to prevent scanning the same directory twice
  const uniqueLocations = locations.filter(
    (location, index, self) => index === self.findIndex((loc) => loc.path === location.path)
  );

  return uniqueLocations;
};

/**
 * Scan all storage locations for importable collections
 */
export const scanForImportableCollections = async (): Promise<ImportableCollection[]> => {
  const allCollections: ImportableCollection[] = [];
  const storageLocations = await getStorageLocations();
  const importManager = CollectionImportExportManager.getInstance();

  for (const location of storageLocations) {
    try {
      if (location.type === 'external' && location.path.startsWith('content://')) {
        // Handle SAF URI - use StorageAccessFramework
        const { StorageAccessFramework } = await import('expo-file-system');

        try {
          // List files in the SAF directory
          const files = await StorageAccessFramework.readDirectoryAsync(location.path);

          for (const fileUri of files) {
            try {
              const fileName = fileUri.split('/').pop() || 'unknown.obs';
              if (fileName.toLowerCase().endsWith('.obs')) {
                // Get display info for this OBS collection file
                const displayInfo = await importManager.getZipDisplayInfo(fileUri);
                if (displayInfo) {
                  allCollections.push({
                    fileName,
                    filePath: fileUri,
                    displayInfo,
                    storageLocation: location,
                  });
                }
              }
            } catch (fileError) {
              console.warn(`Failed to process OBS collection file ${fileUri}:`, fileError);
            }
          }
        } catch (safError) {
          console.warn(`Failed to read SAF directory ${location.path}:`, safError);
        }
      } else {
        // Handle regular file system paths
        // Check if directory exists
        const dirInfo = await FileSystem.getInfoAsync(location.path);
        if (!dirInfo.exists) {
          continue;
        }

        // Get importable collections from this location
        const collections = await importManager.listImportableCollections(location.path);

        // Add storage location info to each collection
        const collectionsWithLocation = collections.map((collection) => ({
          fileName: collection.fileName,
          filePath: `${location.path}${collection.fileName}`,
          displayInfo: collection.displayInfo,
          storageLocation: location,
        }));

        allCollections.push(...collectionsWithLocation);
      }
    } catch (error) {
      console.warn(`Failed to scan storage location ${location.name}:`, error);
    }
  }

  // Deduplicate collections by file path to prevent duplicate entries
  const uniqueCollections = allCollections.filter(
    (collection, index, self) =>
      index === self.findIndex((col) => col.filePath === collection.filePath)
  );

  // Sort by export date (newest first)
  return uniqueCollections.sort(
    (a, b) =>
      new Date(b.displayInfo.exportDate).getTime() - new Date(a.displayInfo.exportDate).getTime()
  );
};

/**
 * Open file picker for manual collection selection
 */
export const pickCollectionFile = async (): Promise<{ uri: string; name: string } | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/octet-stream', // Only accept .obs files
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.name,
      };
    }

    return null;
  } catch (error) {
    console.error('Error picking file:', error);
    throw new Error('Failed to open file picker');
  }
};

/**
 * Validate if a file is a valid OBS collection file
 */
export const validateCollectionFile = async (filePath: string): Promise<boolean> => {
  try {
    // Check if file has .obs extension
    if (!filePath.toLowerCase().endsWith('.obs')) {
      return false;
    }

    // Read the file as binary data
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists || fileInfo.size === 0) {
      return false;
    }

    // Read the first few bytes to check for ZIP signature (OBS files are ZIP format internally)
    const fileContent = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
      length: 4, // Read just the first 4 bytes
    });

    // Check for ZIP file signature (PK\x03\x04)
    const signature = atob(fileContent).substring(0, 4);
    return signature === 'PK\x03\x04';
  } catch (error) {
    console.error('Invalid OBS collection file:', error);
    return false;
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
};

/**
 * Clear the stored custom export directory
 */
export const clearCustomExportDirectory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('@custom_export_directory');
  } catch (error) {
    console.warn('Failed to clear custom export directory:', error);
  }
};

/**
 * Get the stored custom export directory URI
 */
export const getCustomExportDirectory = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('@custom_export_directory');
  } catch (error) {
    console.warn('Failed to get custom export directory:', error);
    return null;
  }
};

/**
 * Check if the stored custom export directory is still accessible
 */
export const validateCustomExportDirectory = async (): Promise<boolean> => {
  try {
    const customDirectoryUri = await getCustomExportDirectory();
    if (!customDirectoryUri) {
      return false;
    }

    // Try to read the directory to see if permissions are still valid
    const { StorageAccessFramework } = await import('expo-file-system');
    await StorageAccessFramework.readDirectoryAsync(customDirectoryUri);
    return true;
  } catch (error) {
    console.warn('Custom export directory is no longer accessible:', error);
    // Clear the invalid directory
    await clearCustomExportDirectory();
    return false;
  }
};

/**
 * Clear the stored custom import directory
 */
export const clearCustomImportDirectory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('@custom_import_directory');
  } catch (error) {
    console.warn('Failed to clear custom import directory:', error);
  }
};

/**
 * Get the stored custom import directory URI
 */
export const getCustomImportDirectory = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('@custom_import_directory');
  } catch (error) {
    console.warn('Failed to get custom import directory:', error);
    return null;
  }
};

/**
 * Check if the stored custom import directory is still accessible
 */
export const validateCustomImportDirectory = async (): Promise<boolean> => {
  try {
    const customDirectoryUri = await getCustomImportDirectory();
    if (!customDirectoryUri) {
      return false;
    }

    // Try to read the directory to see if permissions are still valid
    const { StorageAccessFramework } = await import('expo-file-system');
    await StorageAccessFramework.readDirectoryAsync(customDirectoryUri);
    return true;
  } catch (error) {
    console.warn('Custom import directory is no longer accessible:', error);
    // Clear the invalid directory
    await clearCustomImportDirectory();
    return false;
  }
};
