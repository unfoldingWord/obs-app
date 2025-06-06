import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import {
  CollectionImportExportManager,
  ExportOptions,
  ImportOptions,
  ImportResult,
  VersionConflict,
  ExportManifest,
  CollectionExportInfo,
} from '../core/CollectionImportExportManager';
import { CollectionsManager, Collection } from '../core/CollectionsManager';

interface Props {
  visible: boolean;
  onClose: () => void;
  mode: 'export' | 'import';
  selectedCollectionId?: string; // Single collection for export
}

interface ExportProgress {
  progress: number;
  status: string;
  isComplete: boolean;
}

interface ImportProgress {
  progress: number;
  status: string;
  isComplete: boolean;
  result?: ImportResult;
}

export const CollectionImportExportUI: React.FC<Props> = ({
  visible,
  onClose,
  mode,
  selectedCollectionId,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // State
  const [collection, setCollection] = useState<Collection | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeUserData: true,
    includeThumbnails: true,
    compressionLevel: 6,
    collectionId: selectedCollectionId || '',
  });
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    mergeUserData: true,
    skipVersionCheck: false,
  });
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    progress: 0,
    status: '',
    isComplete: false,
  });
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    progress: 0,
    status: '',
    isComplete: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportPreview, setExportPreview] = useState<ExportManifest | null>(null);

  const manager = CollectionImportExportManager.getInstance();
  const collectionsManager = CollectionsManager.getInstance();

  useEffect(() => {
    if (visible) {
      loadCollection();
    }
  }, [visible]);

  const loadCollection = async () => {
    try {
      const allCollections = await collectionsManager.getLocalCollections();
      const collection = allCollections.find(c => c.id === selectedCollectionId);
      if (collection) {
        setCollection(collection);
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    }
  };

  const generateExportPreview = async () => {
    if (!selectedCollectionId) return;

    try {
      const preview = await manager.getExportInfo([selectedCollectionId]);
      setExportPreview(preview);
    } catch (error) {
      console.error('Error generating export preview:', error);
      Alert.alert('Error', 'Failed to generate export preview');
    }
  };

  const handleExport = async () => {
    if (!selectedCollectionId) {
      Alert.alert('No Collection Selected', 'Please select a collection to export.');
      return;
    }

    try {
      setIsProcessing(true);
      setExportProgress({ progress: 0, status: 'Starting export...', isComplete: false });

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `obs-collections-${timestamp}.zip`;

      // For now, we'll just show a placeholder message
      // In a real implementation, you would use expo-file-system and expo-sharing
      Alert.alert('Export Feature', 'Export functionality requires additional packages:\n\n• expo-document-picker\n• expo-sharing\n• expo-file-system\n\nPlease install these packages to enable import/export.');

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    try {
      // For now, we'll just show a placeholder message
      Alert.alert('Import Feature', 'Import functionality requires additional packages:\n\n• expo-document-picker\n• expo-sharing\n• expo-file-system\n\nPlease install these packages to enable import/export.');

    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderCollectionInfo = () => {
    if (!collection) return null;

    return (
      <View className="mb-6">
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Collection to Export
        </Text>

        <View className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {collection.displayName}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {collection.language} • {collection.version}
          </Text>
        </View>
      </View>
    );
  };

  const renderExportOptions = () => (
    <View className="mb-6">
      <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Export Options
      </Text>

      <View className="space-y-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Include user data (bookmarks, progress)
          </Text>
          <Switch
            value={exportOptions.includeUserData}
            onValueChange={(value) =>
              setExportOptions(prev => ({ ...prev, includeUserData: value }))
            }
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={exportOptions.includeUserData ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Include thumbnails
          </Text>
          <Switch
            value={exportOptions.includeThumbnails}
            onValueChange={(value) =>
              setExportOptions(prev => ({ ...prev, includeThumbnails: value }))
            }
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={exportOptions.includeThumbnails ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      {exportPreview && (
        <View className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Text className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Export Preview
          </Text>
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Total size: {formatFileSize(exportPreview.totalSize)}
          </Text>
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Collections: {exportPreview.collections.length}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={generateExportPreview}
        className={`mt-4 py-2 px-4 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
        disabled={!selectedCollectionId}
      >
        <Text className="text-white text-center font-semibold">Generate Preview</Text>
      </TouchableOpacity>
    </View>
  );

  const renderImportOptions = () => (
    <View className="mb-6">
      <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Import Options
      </Text>

      <View className="space-y-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Overwrite existing collections
          </Text>
          <Switch
            value={importOptions.overwriteExisting}
            onValueChange={(value) =>
              setImportOptions(prev => ({ ...prev, overwriteExisting: value }))
            }
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={importOptions.overwriteExisting ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Merge user data
          </Text>
          <Switch
            value={importOptions.mergeUserData}
            onValueChange={(value) =>
              setImportOptions(prev => ({ ...prev, mergeUserData: value }))
            }
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={importOptions.mergeUserData ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Skip version check
          </Text>
          <Switch
            value={importOptions.skipVersionCheck}
            onValueChange={(value) =>
              setImportOptions(prev => ({ ...prev, skipVersionCheck: value }))
            }
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={importOptions.skipVersionCheck ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );

  const renderProgress = () => {
    const progress = mode === 'export' ? exportProgress : importProgress;

    if (!isProcessing && !progress.isComplete) return null;

    return (
      <View className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <View className="flex-row items-center mb-2">
          {!progress.isComplete && <ActivityIndicator size="small" color="#3B82F6" />}
          <Text className={`ml-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {progress.status}
          </Text>
        </View>

        <View className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}>
          <View
            className="h-2 rounded-full bg-blue-500"
            style={{ width: `${progress.progress}%` }}
          />
        </View>

        <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {Math.round(progress.progress)}%
        </Text>

        {mode === 'import' && progress.isComplete && importProgress.result && (
          <View className="mt-4">
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Import Summary:
            </Text>
            <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              • Imported: {importProgress.result.importedCollection ? 1 : 0}
            </Text>
            <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              • Skipped: {importProgress.result.skipped ? 1 : 0}
            </Text>
            <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              • Errors: {importProgress.result.errors.length}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50">
        <View className={`flex-1 mt-20 rounded-t-3xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {mode === 'export' ? 'Export Collections' : 'Import Collections'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 p-6">
            {mode === 'export' && renderCollectionInfo()}
            {mode === 'export' && renderExportOptions()}
            {mode === 'import' && renderImportOptions()}
            {renderProgress()}
          </ScrollView>

          {/* Actions */}
          <View className={`p-6 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
            <TouchableOpacity
              onPress={mode === 'export' ? handleExport : handleImport}
              disabled={isProcessing || !selectedCollectionId}
              className={`py-4 rounded-xl ${
                isProcessing || !selectedCollectionId
                  ? isDark ? 'bg-gray-600' : 'bg-gray-300'
                  : isDark ? 'bg-blue-600' : 'bg-blue-500'
              }`}
            >
              <Text className="text-white text-center text-lg font-semibold">
                {isProcessing
                  ? mode === 'export' ? 'Exporting...' : 'Importing...'
                  : mode === 'export' ? 'Export Collections' : 'Select File to Import'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
