import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollectionImportExportManager } from '../core/CollectionImportExportManager';
import { Collection, CollectionsManager } from '../core/CollectionsManager';
import { UnifiedLanguagesManager } from '../core/UnifiedLanguagesManager';
import { hashStringToNumber } from '../core/hashStringToNumber';
import { useObsImage } from '../hooks/useObsImage';

// Extended Collection interface to match the one in [language].tsx
interface CollectionWithValidation extends Collection {
  isValid: boolean;
}

// Icon-based Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  visible: boolean;
  collectionName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  collectionName,
  onConfirm,
  onCancel,
  isDark,
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View className="flex-1 items-center justify-center bg-black/50">
      <View
        className={`mx-6 overflow-hidden rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-2xl ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Header with warning icon */}
        <View className="items-center p-6">
          <View
            className={`mb-4 rounded-full p-4 ${isDark ? 'bg-red-600/20' : 'bg-red-500/10'} border ${isDark ? 'border-red-600/30' : 'border-red-500/20'}`}>
            <MaterialIcons name="warning" size={32} color={isDark ? '#F87171' : '#EF4444'} />
          </View>

          {/* Collection info */}
          <View className="max-w-64 items-center">
            <Text
              className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
              numberOfLines={2}>
              {collectionName}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row border-t" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
          {/* Cancel button */}
          <TouchableOpacity
            onPress={onCancel}
            className={`flex-1 items-center justify-center py-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
            style={{ borderRightWidth: 1, borderRightColor: isDark ? '#374151' : '#E5E7EB' }}>
            <MaterialIcons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>

          {/* Delete button */}
          <TouchableOpacity onPress={onConfirm} className="flex-1 items-center justify-center py-4">
            <MaterialIcons name="delete" size={24} color={isDark ? '#F87171' : '#EF4444'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);



interface CollectionInfoModalProps {
  collection: CollectionWithValidation | null;
  visible: boolean;
  onClose: () => void;
  onCollectionDeleted?: () => void;
  onCollectionDownloaded?: () => void;
  isDark?: boolean;
}

export const CollectionInfoModal: React.FC<CollectionInfoModalProps> = ({
  collection,
  visible,
  onClose,
  onCollectionDeleted,
  onCollectionDownloaded,
  isDark = false,
}) => {
  const [languageInfo, setLanguageInfo] = useState<{
    nativeName: string;
    isRTL: boolean;
    isGateway: boolean;
  } | null>(null);
  const [collectionStats, setCollectionStats] = useState<{
    storyCount: number;
    downloadDate: string | null;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);



  // Modal states for icon-based feedback
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const image = useObsImage({
    reference: { story: hashStringToNumber(collection?.id || ''), frame: 1 },
  });

  useEffect(() => {
    const loadLanguageInfo = async () => {
      if (!collection) return;

      try {
        const languagesManager = UnifiedLanguagesManager.getInstance();
        await languagesManager.initialize();

        const langData = await languagesManager.getLanguage(collection.language);
        if (langData) {
          setLanguageInfo({
            nativeName: langData.ln || collection.language,
            isRTL: langData.ld === 'rtl',
            isGateway: langData.gw || false,
          });
        }
      } catch (error) {
        console.error('Error loading language info:', error);
        // Fallback to basic info
        setLanguageInfo({
          nativeName: collection.language,
          isRTL: false,
          isGateway: false,
        });
      }
    };

    const loadCollectionStats = async () => {
      if (!collection) return;

      try {
        const collectionsManager = CollectionsManager.getInstance();
        await collectionsManager.initialize();

        // Get story count
        let storyCount = 50; // Default OBS story count
        if (collection.isDownloaded) {
          try {
            const stories = await collectionsManager.getCollectionStories(collection.id);
            storyCount = stories.length;
          } catch (e) {
            console.warn('Could not get actual story count, using default:', e);
          }
        }

        // Get download date for downloaded collections
        let downloadDate = null;
        if (collection.isDownloaded) {
          downloadDate = collection.lastUpdated.toLocaleDateString();
        }

        setCollectionStats({
          storyCount,
          downloadDate,
        });
      } catch (error) {
        console.error('Error loading collection stats:', error);
        // Fallback stats
        setCollectionStats({
          storyCount: 50,
          downloadDate: null,
        });
      }
    };

    if (visible && collection) {
      loadLanguageInfo();
      loadCollectionStats();
    }
  }, [collection, visible]);

  if (!collection) return null;

  const handleDeleteCollection = async () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteCollection = async () => {
    try {
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.deleteCollection(collection.id);
      setShowDeleteConfirmation(false);
      onClose();
      onCollectionDeleted?.();
    } catch (error) {
      console.error('Error deleting collection:', error);
      setShowDeleteConfirmation(false);
      // Silent failure - no alert message for icon-based UI
    }
  };

  const cancelDeleteCollection = () => {
    setShowDeleteConfirmation(false);
  };

  const handleExportCollection = async () => {
    if (!collection) return;
    setExporting(true);

    try {
      const manager = CollectionImportExportManager.getInstance();
      await manager.initialize();

      // Get the collection data to log metadata
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.initialize();
      const collectionData = await collectionsManager.getCollection(collection.id);
      console.log('Collection metadata:', JSON.stringify(collectionData, null, 2));

      const fileName = `${collection.id.replace('/', '-')}-${collection.version}.obs`;

      // Use StorageAccessFramework for custom location
      const documentsUri = await FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Documents');
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(documentsUri);
      if (!permissions.granted) {
        setExporting(false);
        return; // User cancelled - silent return for icon-based UI
      }

      // Create a temporary file in the cache directory first
      const tempPath = `${FileSystem.cacheDirectory}temp_export.zip`;

      // Export to temporary file
      const actualTempPath = await manager.exportCollection(
        tempPath,
        {
          collectionId: collection.id,
          compressionLevel: 6,
        },
        (progress, status) => {
          console.log(`Export progress: ${progress}% - ${status}`);
        }
      );

      // Read the temporary file as base64 (use the actual path returned)
      const base64Data = await FileSystem.readAsStringAsync(actualTempPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create the file in the selected directory
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        'application/octet-stream'
      );

      // Write the data to the selected location
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Clean up the temporary file
      await FileSystem.deleteAsync(actualTempPath);

      // Store the directory URI for future auto-discovery
      await AsyncStorage.setItem('@custom_export_directory', permissions.directoryUri);

      // Success - show minimal feedback
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error exporting collection:', error);
      setShowErrorModal(true);
    } finally {
      setExporting(false);
    }
  };



  const handleDownloadCollection = async () => {
    if (!collection || downloading) return;

    // Check if collection is valid before attempting download - silent return
    if (!collection.isValid) {
      return;
    }

    try {
      setDownloading(true);
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.initialize();

      // We need the language object for download - construct it from our language info
      const language = {
        lc: collection.language,
        ln: languageInfo?.nativeName || collection.language,
        ang: collection.language, // Using language code as fallback
        ld: languageInfo?.isRTL ? 'rtl' : 'ltr',
        gw: languageInfo?.isGateway || false,
        hc: '',
        lr: '',
        pk: 0,
        alt: [],
        cc: [],
      };

      await collectionsManager.downloadRemoteCollection(collection, language);
      onCollectionDownloaded?.();
      onClose(); // Close modal after successful download
    } catch (error) {
      console.error('Error downloading collection:', error);
      // Silent failure - no alert messages, just remove loading state
    } finally {
      setDownloading(false);
    }
  };

  const handleShareCollection = async () => {
    if (!collection) return;

    try {
      const manager = CollectionImportExportManager.getInstance();
      await manager.initialize();

      const fileName = `${collection.id.replace('/', '-')}-${collection.version}.obs`;
      // Create a temporary file in the cache directory
      const tempPath = `${FileSystem.cacheDirectory}${fileName}`;

      // Export to temporary file
      const actualTempPath = await manager.exportCollection(
        tempPath,
        {
          collectionId: collection.id,
          compressionLevel: 6,
        },
        (progress, status) => {
          console.log(`Export progress: ${progress}% - ${status}`);
        }
      );

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        setShowErrorModal(true);
        return;
      }

      // Share the file
      await Sharing.shareAsync(actualTempPath, {
        mimeType: 'application/octet-stream',
        dialogTitle: `Share ${collection.displayName}`,
        UTI: 'public.data',
      });

      // Clean up the temporary file
      await FileSystem.deleteAsync(tempPath);
    } catch (error) {
      console.error('Error sharing collection:', error);
      setShowErrorModal(true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        {/* Header */}
        <View
          className={`px-6 py-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialIcons name="info" size={28} color={isDark ? '#60A5FA' : '#3B82F6'} />
              {languageInfo?.isGateway && (
                <View className="ml-3 rounded-full bg-blue-500/20 px-2 py-1">
                  <MaterialIcons name="language" size={12} color={isDark ? '#60A5FA' : '#3B82F6'} />
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              className={`rounded-full p-2 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <MaterialIcons name="close" size={24} color={isDark ? '#FFFFFF' : '#374151'} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1">
          {/* Hero Section */}
          <View className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <View className="flex-row items-start">
              {/* Collection Image */}
              <View
                className="mr-4 overflow-hidden rounded-2xl shadow-lg"
                style={{ width: 120, height: 120 }}>
                <Image source={image} style={{ width: 120, height: 120 }} resizeMode="cover" />
              </View>

              {/* Collection Info */}
              <View className="min-w-0 flex-1">
                <Text
                  className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                  numberOfLines={3}>
                  {collection.displayName}
                </Text>
                <Text
                  className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  numberOfLines={2}>
                  {collection.owner.fullName || collection.owner.username}
                </Text>

                {/* Language with Direction */}
                <View className="mt-2 flex-row flex-wrap items-center">
                  <Text
                    className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {languageInfo?.nativeName || collection.language}
                  </Text>
                  {languageInfo?.isRTL && (
                    <View className="ml-2 rounded-full bg-orange-500/20 px-2 py-1">
                      <MaterialIcons
                        name="format-textdirection-r-to-l"
                        size={12}
                        color={isDark ? '#FB923C' : '#EA580C'}
                      />
                    </View>
                  )}
                </View>

                {/* Status Badge */}
                <View className="mt-3">
                  {collection.isDownloaded ? (
                    <View className="flex-row items-center self-start rounded-full bg-green-500/20 px-3 py-2">
                      <MaterialIcons name="check-circle" size={16} color="#10B981" />
                    </View>
                  ) : !collection.isValid ? (
                    <View
                      className={`flex-row items-center self-start rounded-full px-3 py-2 ${isDark ? 'bg-yellow-600/20' : 'bg-yellow-500/20'}`}>
                      <MaterialIcons
                        name="construction"
                        size={16}
                        color={isDark ? '#FCD34D' : '#F59E0B'}
                      />
                    </View>
                  ) : (
                    <View className="flex-row items-center self-start rounded-full bg-blue-500/20 px-3 py-2">
                      <MaterialIcons
                        name="cloud-download"
                        size={16}
                        color={isDark ? '#60A5FA' : '#3B82F6'}
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View className="px-6 py-4">
            <View style={{ gap: 12 }}>
              {/* Story Count */}
              <InfoCard
                icon="library-books"
                value={`${collectionStats?.storyCount || 50}`}
                isDark={isDark}
              />

              {/* Version */}
              <InfoCard icon="update" value={`${collection.version}`} isDark={isDark} />

              {/* Download Date (if downloaded and available) */}
              {collection.isDownloaded && collectionStats?.downloadDate && (
                <InfoCard
                  icon="download-done"
                  value={collectionStats.downloadDate}
                  isDark={isDark}
                />
              )}

              {/* Last Updated */}
              <InfoCard
                icon="schedule"
                value={collection.lastUpdated.toLocaleDateString()}
                isDark={isDark}
              />
            </View>

            {/* Description */}
            {collection.metadata?.description && (
              <View
                className={`mt-6 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
                <View className="mb-2 flex-row items-start">
                  <MaterialIcons
                    name="description"
                    size={18}
                    color={isDark ? '#60A5FA' : '#3B82F6'}
                    style={{ marginTop: 2, marginRight: 8 }}
                  />
                  <Text
                    className={`flex-1 text-sm leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {collection.metadata.description}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Actions Section */}
          <View className="px-6 py-4">
            {collection.isDownloaded ? (
              /* Downloaded Collection Actions */
              <View className="flex-row" style={{ gap: 16 }}>
                <TouchableOpacity
                  onPress={handleExportCollection}
                  disabled={exporting}
                  className={`flex-1 rounded-xl p-4 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg ${exporting ? 'opacity-50' : ''}`}>
                  <View className="flex-row items-center justify-center">
                    {exporting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <MaterialIcons name="save" size={20} color="white" />
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareCollection}
                  className={`flex-1 rounded-xl p-4 ${isDark ? 'bg-green-600' : 'bg-green-500'} shadow-lg`}>
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons name="share" size={20} color="white" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteCollection}
                  className="flex-1 rounded-xl p-4 shadow-lg"
                  style={{ backgroundColor: isDark ? '#DC2626' : '#EF4444' }}>
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons name="delete" size={20} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              /* Available Collection Action */
              <View>
                <TouchableOpacity
                  onPress={handleDownloadCollection}
                  disabled={downloading || !collection.isValid}
                  className={`rounded-xl p-4 shadow-lg ${
                    !collection.isValid
                      ? isDark
                        ? 'bg-yellow-600'
                        : 'bg-yellow-500'
                      : downloading
                      ? `${isDark ? 'bg-blue-600' : 'bg-blue-500'} opacity-50`
                      : `${isDark ? 'bg-blue-600' : 'bg-blue-500'}`
                  }`}>
                  <View className="flex-row items-center justify-center">
                    {downloading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : !collection.isValid ? (
                      <MaterialIcons name="schedule" size={24} color="white" />
                    ) : (
                      <MaterialIcons name="download" size={24} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bottom spacing */}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>

      {showDeleteConfirmation && (
        <DeleteConfirmationModal
          visible={showDeleteConfirmation}
          collectionName={collection.displayName}
          onConfirm={confirmDeleteCollection}
          onCancel={cancelDeleteCollection}
          isDark={isDark}
        />
      )}



      {/* Success Modal */}
      <Modal visible={showSuccessModal} animationType="fade" transparent onRequestClose={() => setShowSuccessModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className={`mx-6 rounded-2xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="items-center">
              <View className={`mb-6 rounded-full p-4 ${isDark ? 'bg-green-600/20' : 'bg-green-500/10'}`}>
                <MaterialIcons name="check-circle" size={48} color={isDark ? '#10B981' : '#059669'} />
              </View>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)} className={`rounded-xl p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <View className="items-center">
                  <MaterialIcons name="close" size={24} color={isDark ? '#FFFFFF' : '#374151'} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} animationType="fade" transparent onRequestClose={() => setShowErrorModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className={`mx-6 rounded-2xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="items-center">
              <View className={`mb-6 rounded-full p-4 ${isDark ? 'bg-red-600/20' : 'bg-red-500/10'}`}>
                <MaterialIcons name="error" size={48} color={isDark ? '#EF4444' : '#DC2626'} />
              </View>
              <TouchableOpacity onPress={() => setShowErrorModal(false)} className={`rounded-xl p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <View className="items-center">
                  <MaterialIcons name="close" size={24} color={isDark ? '#FFFFFF' : '#374151'} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

interface InfoCardProps {
  icon: string;
  value: string;
  isDark: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, value, isDark }) => (
  <View
    className={`flex-row items-center rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
    <View className={`mr-4 rounded-full p-3 ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/10'}`}>
      <MaterialIcons name={icon as any} size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
    </View>
    <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {value}
    </Text>
  </View>
);
