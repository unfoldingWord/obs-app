import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CollectionImportExportManager,
  ImportError,
} from '../../../src/core/CollectionImportExportManager';

export default function TestImportExportScreen() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [exportPath, setExportPath] = useState<string>('');
  const [importResult, setImportResult] = useState<any>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const manager = CollectionImportExportManager.getInstance();

  const handleExport = async () => {
    try {
      setLoading(true);
      setStatus('Creating test collection...');
      await manager.initialize();

      const filePath = `${FileSystem.documentDirectory}test-export.zip`;
      setExportPath(filePath);

      setStatus('Exporting collection...');
      await manager.testExportWithScope(filePath);

      setStatus('Export complete!');
      Alert.alert('Success', `Collection exported to: ${filePath}`);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Error',
        `Export failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!exportPath) {
      Alert.alert('Error', 'Please export a collection first');
      return;
    }

    try {
      setLoading(true);
      setStatus('Importing collection...');
      await manager.initialize();

      const result = await manager.testImportWithScope(exportPath);
      setImportResult(result);

      if (result.success) {
        setStatus('Import complete!');
        Alert.alert('Success', 'Collection imported successfully');
      } else {
        setStatus('Import failed');
        Alert.alert(
          'Error',
          `Import failed: ${result.errors.map((e: ImportError) => e.message).join(', ')}`
        );
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Error',
        `Import failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <View className="flex-1 p-4">
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`mb-4 rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>

          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Test Import/Export
          </Text>
          <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Test the Scripture Burrito import/export functionality with scope information
          </Text>
        </View>

        <ScrollView className="flex-1">
          <View className="space-y-4">
            <TouchableOpacity
              onPress={handleExport}
              disabled={loading}
              className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Export Test Collection
                  </Text>
                  <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Create and export a test collection with scope information
                  </Text>
                </View>
                <MaterialIcons
                  name="file-download"
                  size={24}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleImport}
              disabled={loading || !exportPath}
              className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Import Test Collection
                  </Text>
                  <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Import the exported test collection
                  </Text>
                </View>
                <MaterialIcons
                  name="file-upload"
                  size={24}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
              </View>
            </TouchableOpacity>

            {status && (
              <View
                className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Text
                  className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Status
                </Text>
                <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {status}
                </Text>
              </View>
            )}

            {importResult && (
              <View
                className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Text
                  className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Import Result
                </Text>
                <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {JSON.stringify(importResult, null, 2)}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {loading && (
          <View className="absolute inset-0 items-center justify-center bg-black/50">
            <View className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
              <Text className={`mt-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {status}
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
