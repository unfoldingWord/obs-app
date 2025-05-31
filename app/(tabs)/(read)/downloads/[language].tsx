import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollectionInfoModal } from '../../../../src/components/CollectionInfoModal';
import {
  CollectionsManager,
  Collection,
} from '../../../../src/core/CollectionsManager';
import { hashStringToNumber } from '../../../../src/core/hashStringToNumber';
import { SearchBar } from '../../../components/SearchBar';

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

interface Language {
  alt: string[];
  ang: string;
  cc: string[];
  gw: boolean;
  hc: string;
  lc: string;
  ld: 'ltr' | 'rtl';
  ln: string;
  lr: string;
  pk: number;
}

export default function LanguageScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [collectionsManager, setCollectionsManager] = useState<CollectionsManager | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Parse language data from URL parameters
  const language: Language = {
    lc: (params.lc as string) || (params.language as string) || '',
    ln: (params.ln as string) || '',
    ang: (params.ang as string) || '',
    ld: (params.ld as 'ltr' | 'rtl') || 'ltr',
    gw: params.gw === 'true',
    hc: (params.hc as string) || '',
    lr: (params.lr as string) || '',
    pk: parseInt((params.pk as string) || '0', 10),
    alt: params.alt ? JSON.parse(params.alt as string) : [],
    cc: params.cc ? JSON.parse(params.cc as string) : []
  };

  useEffect(() => {
    const initManager = async () => {
      const manager = CollectionsManager.getInstance();
      await manager.initialize();
      setCollectionsManager(manager);
    };
    initManager();
  }, []);

  useEffect(() => {
    if (collectionsManager && language.lc) {
      loadCollections();
    }
  }, [language.lc, collectionsManager]);

  const loadCollections = async () => {
    if (!collectionsManager || !language.lc) return;
    try {
      setLoading(true);
      const remoteCollectionsPromise = collectionsManager.getRemoteCollectionsByLanguage(
        language.lc
      );

      const localCollectionsPromise = collectionsManager.getLocalCollectionsByLanguage(
        language.lc
      );

      const [remoteCollectionsWithOwners, localCollections] = await Promise.all([
        remoteCollectionsPromise,
        localCollectionsPromise,
      ]);

      // Extract just the collections from the remote collections with owner data
      const remoteCollections = remoteCollectionsWithOwners.map(({ collection }) => collection);

      const localCollectionIds = new Set(localCollections.map((lc) => lc.id));

      const allCollections: Collection[] = [
        ...localCollections,
        ...remoteCollections.filter((rc) => !localCollectionIds.has(rc.id)),
      ];

      setCollections(allCollections);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCollection = (collection: Collection) => {
    if (collection.isDownloaded) {
      // Navigate to stories screen for downloaded collections
      router.push(`/stories?collectionId=${encodeURIComponent(collection.id)}`);
    } else {
      // Show info modal for non-downloaded collections
      handleShowInfo(collection);
    }
  };

  const handleDownload = async (collection: Collection) => {
    if (!collectionsManager) return;
    try {
      setDownloadingId(collection.id);

      // Use the standard download method which now uses embedded owner data
      await collectionsManager.downloadRemoteCollection(collection, language);

      await loadCollections(); // Refresh the list
    } catch (err) {
      console.error('Download failed:', err);
      Alert.alert(
        'Download Failed',
        'There was an error downloading this collection. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteCollection = async (collection: Collection) => {
    if (!collectionsManager) return;
    setCollectionToDelete(collection);
    setShowDeleteConfirmation(true);
  };

  const handleShowInfo = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowInfoModal(true);
  };

  const handleCloseInfo = () => {
    setShowInfoModal(false);
    setSelectedCollection(null);
  };

  const handleCollectionDeleted = () => {
    loadCollections(); // Refresh the list
  };

  const handleDeleteConfirmation = async () => {
    if (!collectionsManager || !collectionToDelete) return;
    try {
      setDownloadingId(collectionToDelete.id);
      await collectionsManager.deleteCollection(collectionToDelete.id);
      setShowDeleteConfirmation(false);
      setCollectionToDelete(null);
      await loadCollections(); // Refresh the list
    } catch (err) {
      console.error('Delete failed:', err);
      setShowDeleteConfirmation(false);
      setCollectionToDelete(null);
      Alert.alert(
        'Delete Failed',
        'There was an error deleting this collection. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setCollectionToDelete(null);
  };

  const filteredCollections = collections.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.displayName.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.owner.username.toLowerCase().includes(q)
    );
  });

  const downloadedCollections = filteredCollections.filter((c) => c.isDownloaded);
  const notDownloadedCollections = filteredCollections.filter((c) => !c.isDownloaded);

  const renderCollectionItem = ({ item }: { item: Collection }) => {
    const storyNumber = hashStringToNumber(item.id);
    const fallbackImageUrl = `https://cdn.door43.org/obs/jpg/360px/obs-en-${String(storyNumber).padStart(2, '0')}-01.jpg`;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleSelectCollection(item)}
        className={`mx-3 mb-4 overflow-hidden rounded-2xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        style={{ elevation: 8 }}>
        <View className="p-4">
          <View className="flex-row items-center">
            {/* Collection Image */}
            <View className="mr-4 overflow-hidden rounded-xl shadow-md">
              <Image
                source={{ uri: item.metadata?.thumbnail || fallbackImageUrl }}
                style={{ width: 72, height: 72 }}
                resizeMode="cover"
              />
            </View>

            {/* Collection Info */}
            <View className="flex-1">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                    numberOfLines={2}>
                {item.displayName}
              </Text>
              <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    numberOfLines={1}>
                {item.owner.fullName || item.owner.username}
              </Text>

              {/* Status Badge */}
              <View className="mt-2 flex-row items-center">
                {item.isDownloaded ? (
                  <View className="rounded-full bg-green-500/20 px-2 py-1">
                    <MaterialIcons name="check-circle" size={16} color="#10B981" />
                  </View>
                ) : (
                  <View className="rounded-full bg-blue-500/20 px-2 py-1">
                    <MaterialIcons name="cloud-download" size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center">
              {/* Info Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleShowInfo(item);
                }}
                className={`mr-2 rounded-full p-3 ${isDark ? 'bg-gray-600/30' : 'bg-gray-200/50'}`}>
                <MaterialIcons name="info" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>

              {/* Download/Delete Button */}
              {!item.isDownloaded ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDownload(item);
                  }}
                  className="rounded-full bg-blue-600 p-3 shadow-lg"
                  disabled={downloadingId === item.id}>
                  {downloadingId === item.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialIcons name="download" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteCollection(item);
                  }}
                  className="rounded-full bg-red-600 p-3 shadow-lg"
                  disabled={downloadingId === item.id}>
                  {downloadingId === item.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialIcons name="delete" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (data: Collection[], iconName: "check-circle" | "cloud-download", badgeColor: string) => {
    if (data.length === 0) return null;

    return (
      <View className="mb-6">
        {/* Section Header */}
        <View className="mx-3 mb-4 flex-row items-center">
          <MaterialIcons name={iconName} size={24} color={isDark ? '#60A5FA' : '#3B82F6'} />
          <View className={`ml-3 rounded-full px-3 py-1 ${badgeColor}`}>
            <Text className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
              {data.length}
            </Text>
          </View>
        </View>

        {/* Collections */}
        {data.map((item) => renderCollectionItem({ item }))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center">
          <View className={`rounded-2xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
            <MaterialIcons
              name="library-books"
              size={32}
              color={isDark ? '#60A5FA' : '#3B82F6'}
              style={{ marginTop: 16, alignSelf: 'center' }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center p-6">
          <View className="items-center">
            <View className={`mb-6 rounded-3xl p-6 ${isDark ? 'bg-red-600/20' : 'bg-red-500/10'} border ${isDark ? 'border-red-600/30' : 'border-red-500/20'}`}>
              <MaterialIcons
                name="error-outline"
                size={48}
                color={isDark ? '#F87171' : '#EF4444'}
              />
            </View>
            <TouchableOpacity
              onPress={loadCollections}
              className={`rounded-2xl px-8 py-4 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-xl`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}>
              <MaterialIcons name="refresh" size={24} color="white" />
              <MaterialIcons name="cloud-download" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Language Header */}
      <View className={`px-6 py-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`mr-4 rounded-full p-2 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#374151'} />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center">
            <MaterialIcons
              name={language.gw ? "language" : "translate"}
              size={28}
              color={isDark ? '#60A5FA' : '#3B82F6'}
            />
            <View className="ml-3 flex-1">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                    style={{ textAlign: language.ld === 'rtl' ? 'right' : 'left' }}>
                {language.ln || language.ang || language.lc}
              </Text>
              {language.ln && language.ang && language.ln !== language.ang && (
                <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ textAlign: language.ld === 'rtl' ? 'right' : 'left' }}>
                  {language.ang} ({language.lc})
                </Text>
              )}
              {language.gw && (
                <View className="mt-1 flex-row items-center"
                      style={{ justifyContent: language.ld === 'rtl' ? 'flex-end' : 'flex-start' }}>
                  <View className="rounded-full bg-blue-500/20 px-2 py-1">
                    <Text className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                      GW
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Search */}
      <View className={`px-6 py-4 ${isDark ? 'bg-gray-900/50' : 'bg-white/50'}`}>
        <SearchBar
          placeholder=""
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View className="py-4">
            {renderSection(downloadedCollections, "check-circle", isDark ? 'bg-green-600/20' : 'bg-green-500/10')}
            {renderSection(notDownloadedCollections, "cloud-download", isDark ? 'bg-blue-600/20' : 'bg-blue-500/10')}
          </View>
        }
        keyExtractor={() => Math.random().toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}
        ListEmptyComponent={
          !filteredCollections.length ? (
            <View className="mt-12 items-center px-6">
              <View className={`mb-6 rounded-3xl p-6 ${isDark ? 'bg-gray-600/20' : 'bg-gray-500/10'} border ${isDark ? 'border-gray-600/30' : 'border-gray-500/20'}`}>
                <MaterialIcons name="search-off" size={48} color={isDark ? '#6B7280' : '#9CA3AF'} />
              </View>
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className={`rounded-2xl px-6 py-3 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <MaterialIcons name="clear" size={20} color="white" />
                <MaterialIcons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <CollectionInfoModal
        collection={selectedCollection}
        visible={showInfoModal}
        onClose={handleCloseInfo}
        onCollectionDeleted={handleCollectionDeleted}
        onCollectionDownloaded={loadCollections}
        isDark={isDark}
      />

      <DeleteConfirmationModal
        visible={showDeleteConfirmation}
        collectionName={collectionToDelete?.displayName || ''}
        onConfirm={handleDeleteConfirmation}
        onCancel={handleCancelDelete}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}
