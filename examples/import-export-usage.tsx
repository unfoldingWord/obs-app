// Example: How to integrate Collection Import/Export into your app

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

// Import the components we created
import { CollectionImportExportUI } from '../src/components/CollectionImportExportUI';
import {
  CollectionImportExportManager,
  ImportResult
} from '../src/core/CollectionImportExportManager';
import { CollectionsManager, Collection } from '../src/core/CollectionsManager';
import { StoryManager } from '../src/core/storyManager';

// Example integration in a Collections management screen
export const CollectionsManagementScreen: React.FC = () => {
  const [showImportExport, setShowImportExport] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'export' | 'import'>('export');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>();

  const handleExportCollection = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setImportExportMode('export');
    setShowImportExport(true);
  };

  const handleImportCollections = () => {
    setImportExportMode('import');
    setShowImportExport(true);
  };

  const handleQuickExportAll = async () => {
    try {
      const manager = CollectionImportExportManager.getInstance();

      // Get all downloaded collections
      const collectionsManager = CollectionsManager.getInstance();
      const allCollections = await collectionsManager.getLocalCollections();
      const downloadedCollections = allCollections.filter((c: Collection) => c.isDownloaded);

      if (downloadedCollections.length === 0) {
        Alert.alert('No Collections', 'No downloaded collections found to export.');
        return;
      }

      // Export each collection separately (single collection per file)
      for (const collection of downloadedCollections) {
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `${collection.displayName.replace(/\s+/g, '-')}-${timestamp}.zip`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;

        const options = {
          includeUserData: true,
          includeThumbnails: true,
          compressionLevel: 6,
          collectionId: collection.id,
        };

        await manager.exportCollection(filePath, options, (progress, status) => {
          console.log(`Export ${collection.displayName}: ${progress}% - ${status}`);
        });
      }

      Alert.alert('Success', `All ${downloadedCollections.length} collections exported separately`);
    } catch (error) {
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-6">Collection Management</Text>

      {/* Import/Export Actions */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-4">Import/Export</Text>

        <View className="flex-row space-x-4">
          <TouchableOpacity
            onPress={() => Alert.alert('Feature', 'Select a collection first, then use the export option from its context menu.')}
            className="flex-1 bg-blue-500 py-3 rounded-lg"
          >
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="file-upload" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Export Collection</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleImportCollections}
            className="flex-1 bg-green-500 py-3 rounded-lg"
          >
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="file-download" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Import</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleQuickExportAll}
          className="mt-2 bg-purple-500 py-3 rounded-lg"
        >
          <View className="flex-row items-center justify-center">
            <MaterialIcons name="archive" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Quick Export All (Separate Files)</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Your existing collections list would go here */}
      {/* ... */}

      {/* Import/Export Modal */}
      <CollectionImportExportUI
        visible={showImportExport}
        onClose={() => setShowImportExport(false)}
        mode={importExportMode}
        selectedCollectionId={selectedCollectionId}
      />
    </View>
  );
};

// Example: Adding export option to collection context menu
export const CollectionContextMenu = ({
  collection,
  onExport
}: {
  collection: Collection;
  onExport: (collectionId: string) => void;
}) => {
  return (
    <View>
      {/* Other menu items */}

      <TouchableOpacity
        onPress={() => onExport(collection.id)}
        className="flex-row items-center p-3"
      >
        <MaterialIcons name="share" size={20} color="#6B7280" />
        <Text className="ml-3 text-gray-700">Export Collection</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example: Programmatic usage for bulk operations
export class BulkCollectionOperations {
  private manager = CollectionImportExportManager.getInstance();

  async exportAllUserCollections(outputDir: string): Promise<void> {
    try {
      const collectionsManager = CollectionsManager.getInstance();
      const collections = await collectionsManager.getLocalCollections();

      // Filter for collections with user data and export each separately
      for (const collection of collections) {
        const hasUserData = await this.hasUserData(collection.id);
        if (hasUserData) {
          const fileName = `${collection.displayName.replace(/\s+/g, '-')}.zip`;
          const outputPath = `${outputDir}/${fileName}`;

          const options = {
            includeUserData: true,
            includeThumbnails: true,
            compressionLevel: 9, // Maximum compression for remote-compatible format
            collectionId: collection.id,
          };

          await this.manager.exportCollection(outputPath, options);
        }
      }
    } catch (error) {
      console.error('Bulk export failed:', error);
      throw error;
    }
  }

  async importAndMerge(filePath: string): Promise<ImportResult> {
    const options = {
      overwriteExisting: false, // Don't overwrite existing collections
      mergeUserData: true,      // Merge user data with existing
      skipVersionCheck: false,  // Check version compatibility
    };

    return await this.manager.importCollection(filePath, options);
  }

  private async hasUserData(collectionId: string): Promise<boolean> {
    const storyManager = StoryManager.getInstance();

    const markers = await storyManager.getAllMarkers();
    const hasMarkers = markers.some((m: any) => m.collectionId === collectionId);

    const progress = await storyManager.getAllReadingProgress();
    const hasProgress = progress.some((p: any) => p.collectionId === collectionId);

    return hasMarkers || hasProgress;
  }
}

// Example: Adding import/export to settings screen
export const SettingsScreen: React.FC = () => {
  const [showImportExport, setShowImportExport] = useState(false);

  return (
    <View className="flex-1">
      {/* Other settings */}

      <View className="p-4 border-t border-gray-200">
        <Text className="text-lg font-semibold mb-4">Data Management</Text>

        <TouchableOpacity
          onPress={() => setShowImportExport(true)}
          className="flex-row items-center justify-between py-3"
        >
          <View className="flex-row items-center">
            <MaterialIcons name="import-export" size={24} color="#6B7280" />
            <View className="ml-3">
              <Text className="font-semibold">Import/Export Collections</Text>
              <Text className="text-sm text-gray-600">
                Share collections between devices
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <CollectionImportExportUI
        visible={showImportExport}
        onClose={() => setShowImportExport(false)}
        mode="export" // Default to export mode
      />
    </View>
  );
};

// Example: Error handling and user feedback
export const useImportExportOperations = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const exportWithFeedback = async (collectionIds: string[], options: any) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setStatus('Starting export...');

      const manager = CollectionImportExportManager.getInstance();
      const timestamp = new Date().toISOString().split('T')[0];
      const filePath = `${FileSystem.documentDirectory}obs-export-${timestamp}.zip`;

      await manager.exportCollections(filePath, {
        ...options,
        collections: collectionIds,
      }, (progress, status) => {
        setProgress(progress);
        setStatus(status);
      });

      setStatus('Export complete!');
      return filePath;
    } catch (error) {
      setStatus('Export failed');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const importWithFeedback = async (filePath: string, options: any) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setStatus('Starting import...');

      const manager = CollectionImportExportManager.getInstance();
      const result = await manager.importCollection(filePath, options, (progress, status) => {
        setProgress(progress);
        setStatus(status);
      });

      setStatus('Import complete!');
      return result;
    } catch (error) {
      setStatus('Import failed');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    progress,
    status,
    exportWithFeedback,
    importWithFeedback,
  };
};

// Example: Installation instructions component
export const ImportExportSetupInstructions: React.FC = () => {
  return (
    <View className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <View className="flex-row items-center mb-2">
        <MaterialIcons name="info" size={20} color="#3B82F6" />
        <Text className="ml-2 font-semibold text-blue-800">
          Collection Import/Export
        </Text>
      </View>

      <Text className="text-blue-700 mb-3">
        Share collections between devices using a lightweight, remote-compatible format.
        No images needed - they're bundled with the app!
      </Text>

      <Text className="text-blue-700 mb-3">
        To enable import/export functionality, install these packages:
      </Text>

      <View className="bg-gray-800 p-3 rounded mb-3">
        <Text className="text-green-400 font-mono text-sm">
          npm install jszip{'\n'}
          npx expo install expo-document-picker expo-sharing expo-file-system
        </Text>
      </View>

      <Text className="text-blue-700 text-sm">
        Features: Small file sizes (~60KB vs 50MB+), fast processing,
        preserves bookmarks and reading progress.
      </Text>
    </View>
  );
};
