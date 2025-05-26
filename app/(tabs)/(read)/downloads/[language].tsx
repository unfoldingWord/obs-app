import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CollectionsManager,
  Collection as CoreCollection,
} from '../../../../src/core/CollectionsManager';
import { SearchBar } from '../../../components/SearchBar';
import { hashStringToNumber } from '../../../../src/core/hashStringToNumber';

interface Collection {
  id: string;
  title: string;
  owner: string;
  language: string;
  version: string;
  thumbnailUrl: string;
  localThumbnailUrl?: string | null;
  downloaded: boolean;
  coreCollection: CoreCollection;
}

export default function LanguageScreen() {
  const { language } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [collectionsManager, setCollectionsManager] = useState<CollectionsManager | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const initManager = async () => {
      const manager = CollectionsManager.getInstance();
      await manager.initialize();
      setCollectionsManager(manager);
    };
    initManager();
  }, []);

  useEffect(() => {
    if (collectionsManager && language) {
      loadCollections();
    }
  }, [language, collectionsManager]);

  const loadCollections = async () => {
    if (!collectionsManager || !language) return;
    try {
      setLoading(true);
      const remoteCollectionsPromise = collectionsManager.getRemoteCollectionsByLanguage(
        language as string
      );
      console.log({ remoteCollectionsPromise });
      const localCollectionsPromise = collectionsManager.getLocalCollectionsByLanguage(
        language as string
      );
      console.log({ localCollectionsPromise });

      const [remoteCollections, localCollections] = await Promise.all([
        remoteCollectionsPromise,
        localCollectionsPromise,
      ]);

      const localCollectionIds = new Set(localCollections.map((lc) => lc.id));

      const allCollectionsData: CoreCollection[] = [
        ...localCollections,
        ...remoteCollections.filter((rc) => !localCollectionIds.has(rc.id)),
      ];

      const collectionsPromises = allCollectionsData.map(async (coreCollection: CoreCollection) => {
        const localThumbnailUrl = await collectionsManager.getCollectionThumbnail(
          coreCollection.id
        );
        const storyNumber = hashStringToNumber(coreCollection.id); // Keep for default thumbnail if needed

        console.log({ coreCollection, localThumbnailUrl, storyNumber });

        return {
          id: coreCollection.id,
          title: coreCollection.displayName || coreCollection.id,
          owner: coreCollection.owner || 'unknown',
          language: coreCollection.language,
          version: coreCollection.version,
          thumbnailUrl:
            coreCollection.metadata?.thumbnail ||
            `https://cdn.door43.org/obs/jpg/360px/obs-en-${String(storyNumber).padStart(2, '0')}-01.jpg`,
          localThumbnailUrl,
          downloaded: coreCollection.isDownloaded || false,
          coreCollection, // Store original
        };
      });

      const mappedCollections = await Promise.all(collectionsPromises);

      setCollections(mappedCollections);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCollection = (collection: Collection) => {
    router.push(`../story/${collection.id}/01/01`);
  };

  const handleDownload = async (collection: Collection) => {
    if (!collectionsManager) return;
    try {
      setDownloadingId(collection.id);
      await collectionsManager.downloadRemoteCollection(collection.coreCollection);
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
    Alert.alert('Delete Collection', `Are you sure you want to delete ${collection.title}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDownloadingId(collection.id);
            await collectionsManager.deleteCollection(collection.id);
            await loadCollections(); // Refresh the list
          } catch (err) {
            console.error('Delete failed:', err);
            Alert.alert(
              'Delete Failed',
              'There was an error deleting this collection. Please try again.',
              [{ text: 'OK' }]
            );
          } finally {
            setDownloadingId(null);
          }
        },
      },
    ]);
  };

  const filteredCollections = collections.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.owner.toLowerCase().includes(q)
    );
  });

  const downloadedCollections = filteredCollections.filter((c) => c.downloaded);
  const notDownloadedCollections = filteredCollections.filter((c) => !c.downloaded);

  const renderCollectionItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleSelectCollection(item)}
      className={`m-2 flex-row items-center rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Image
        source={{ uri: item.localThumbnailUrl || item.thumbnailUrl }}
        style={{ width: 64, height: 64, borderRadius: 8, marginRight: 16 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.title}
        </Text>
        <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          ID: {item.id}
        </Text>
        <Text className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Owner: {item.owner}
        </Text>
      </View>
      {!item.downloaded ? (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleDownload(item);
          }}
          className={`mr-2 rounded-full p-2 ${isDark ? 'bg-blue-700' : 'bg-blue-500'}`}
          disabled={downloadingId === item.id}>
          {downloadingId === item.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="file-download" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteCollection(item);
          }}
          className={`mr-2 rounded-full p-2 ${isDark ? 'bg-red-700' : 'bg-red-500'}`}
          disabled={downloadingId === item.id}>
          {downloadingId === item.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="delete" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}
      <MaterialIcons
        name="chevron-right"
        size={24}
        color={isDark ? '#60A5FA' : '#3B82F6'}
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>
  );

  const renderSection = (title: string, data: Collection[]) =>
    data.length > 0 && (
      <View>
        <Text className="mb-2 mt-4 text-base font-bold" style={{ color: isDark ? '#fff' : '#222' }}>
          {title}
        </Text>
        {data.map((item) => renderCollectionItem({ item }))}
      </View>
    );

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading collections...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center p-4">
          <MaterialIcons name="error-outline" size={48} color={isDark ? '#F87171' : '#EF4444'} />
          <Text
            className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadCollections}
            className={`mt-6 rounded-lg px-4 py-2 ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
            <Text className="text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <View
        style={{
          backgroundColor: isDark ? '#1F2937' : '#fff',
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 8,
          zIndex: 10,
        }}>
        <SearchBar
          placeholder="Search collections..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <>
              {renderSection('Downloaded', downloadedCollections)}
              {renderSection('Available to Download', notDownloadedCollections)}
            </>
          }
          keyExtractor={() => Math.random().toString()}
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !filteredCollections.length ? (
              <View className="mt-12 items-center">
                <MaterialIcons name="search-off" size={48} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No collections found
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </>
  );
}
