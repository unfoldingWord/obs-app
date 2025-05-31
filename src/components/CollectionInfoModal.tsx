import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Collection, CollectionsManager } from '../core/CollectionsManager';
import { UnifiedLanguagesManager } from '../core/UnifiedLanguagesManager';
import { hashStringToNumber } from '../core/hashStringToNumber';
import { useObsImage } from '../hooks/useObsImage';

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
      <View className={`mx-6 overflow-hidden rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Header with warning icon */}
        <View className="items-center p-6">
          <View className={`mb-4 rounded-full p-4 ${isDark ? 'bg-red-600/20' : 'bg-red-500/10'} border ${isDark ? 'border-red-600/30' : 'border-red-500/20'}`}>
            <MaterialIcons name="warning" size={32} color={isDark ? '#F87171' : '#EF4444'} />
          </View>

          {/* Collection info */}
          <View className="items-center max-w-64">
            <Text className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={2}>
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
          <TouchableOpacity
            onPress={onConfirm}
            className="flex-1 items-center justify-center py-4">
            <MaterialIcons name="delete" size={24} color={isDark ? '#F87171' : '#EF4444'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

interface CollectionInfoModalProps {
  collection: Collection | null;
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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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

  const storyNumber = hashStringToNumber(collection.id);
  const fallbackImageUrl = `https://cdn.door43.org/obs/jpg/360px/obs-en-${String(storyNumber).padStart(2, '0')}-01.jpg`;

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
      Alert.alert(
        'Error',
        'Failed to delete collection. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const cancelDeleteCollection = () => {
    setShowDeleteConfirmation(false);
  };

  const handleExportCollection = () => {
    // TODO: Implement export functionality
    Alert.alert(
      'Export Collection',
      'Export functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  const handleDownloadCollection = async () => {
    if (!collection || downloading) return;

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
        cc: []
      };

      await collectionsManager.downloadRemoteCollection(collection, language);
      onCollectionDownloaded?.();
      onClose(); // Close modal after successful download
    } catch (error) {
      console.error('Error downloading collection:', error);
      Alert.alert(
        'Download Failed',
        'There was an error downloading this collection. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        {/* Header */}
        <View className={`px-6 py-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialIcons name="info" size={28} color={isDark ? '#60A5FA' : '#3B82F6'} />
              {languageInfo?.isGateway && (
                <View className="ml-3 rounded-full bg-blue-500/20 px-2 py-1">
                  <Text className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                    GW
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              className={`rounded-full p-2 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <MaterialIcons
                name="close"
                size={24}
                color={isDark ? '#FFFFFF' : '#374151'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1">
          {/* Hero Section */}
          <View className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <View className="flex-row items-start">
              {/* Collection Image */}
              <View className="mr-4 overflow-hidden rounded-2xl shadow-lg" style={{ width: 120, height: 120 }}>
                <Image
                  source={{ uri: collection.metadata?.thumbnail || fallbackImageUrl }}
                  style={{ width: 120, height: 120 }}
                  resizeMode="cover"
                />
              </View>

              {/* Collection Info */}
              <View className="flex-1 min-w-0">
                <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                      numberOfLines={3}>
                  {collection.displayName}
                </Text>
                <Text className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                      numberOfLines={2}>
                  {collection.owner.fullName || collection.owner.username}
                </Text>

                {/* Language with Direction */}
                <View className="mt-2 flex-row items-center flex-wrap">
                  <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {languageInfo?.nativeName || collection.language}
                  </Text>
                  {languageInfo?.isRTL && (
                    <View className="ml-2 rounded-full bg-orange-500/20 px-2 py-1">
                      <Text className={`text-xs font-medium ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>
                        RTL
                      </Text>
                    </View>
                  )}
                </View>

                {/* Status Badge */}
                <View className="mt-3">
                  {collection.isDownloaded ? (
                    <View className="flex-row items-center rounded-full bg-green-500/20 px-3 py-2 self-start">
                      <MaterialIcons name="check-circle" size={16} color="#10B981" />
                      <Text className="ml-2 text-sm font-medium text-green-600">Downloaded</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center rounded-full bg-blue-500/20 px-3 py-2 self-start">
                      <MaterialIcons name="cloud-download" size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                      <Text className={`ml-2 text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                        Available
                      </Text>
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
                value={`${collectionStats?.storyCount || 50} Stories`}
                isDark={isDark}
              />

              {/* Version */}
              <InfoCard
                icon="update"
                value={`${collection.version}`}
                isDark={isDark}
              />

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
              <View className={`mt-6 p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
                <View className="flex-row items-start mb-2">
                  <MaterialIcons
                    name="description"
                    size={18}
                    color={isDark ? '#60A5FA' : '#3B82F6'}
                    style={{ marginTop: 2, marginRight: 8 }}
                  />
                  <Text className={`text-sm leading-6 flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
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
              <View className="flex-row" style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={handleExportCollection}
                  className={`flex-1 rounded-xl p-3 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg`}>
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons name="share" size={20} color="white" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteCollection}
                  className={`flex-1 rounded-xl p-3 ${isDark ? 'bg-red-600' : 'bg-red-500'} shadow-lg`}>
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons name="delete" size={20} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              /* Available Collection Action */
              <TouchableOpacity
                onPress={handleDownloadCollection}
                disabled={downloading}
                className={`rounded-xl p-4 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg ${downloading ? 'opacity-50' : ''}`}>
                <View className="flex-row items-center justify-center">
                  {downloading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <MaterialIcons name="download" size={24} color="white" />
                  )}
                </View>
              </TouchableOpacity>
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
    </Modal>
  );
};

interface InfoCardProps {
  icon: string;
  value: string;
  isDark: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, value, isDark }) => (
  <View className={`flex-row items-center p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
    <View className={`mr-4 rounded-full p-3 ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/10'}`}>
      <MaterialIcons
        name={icon as any}
        size={20}
        color={isDark ? '#60A5FA' : '#3B82F6'}
      />
    </View>
    <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {value}
    </Text>
  </View>
);
