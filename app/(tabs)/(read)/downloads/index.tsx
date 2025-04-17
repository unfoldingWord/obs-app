import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useNetworkState } from 'expo-network';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBar } from '../../../components/SearchBar';
import { Repository, RepositoryManager } from '../../../../src/core/repositoryManager';

/**
 * Represents a language in the Door43 catalog
 * @interface Language
 * @property {string[]} alt - Alternative names for the language
 * @property {string} ang - English name of the language
 * @property {string[]} cc - Country codes where this language is spoken
 * @property {boolean} gw - Whether this is a Gateway language (commonly used for translation)
 * @property {string} hc - Home country code (primary country where the language is spoken)
 * @property {string} lc - Language code (ISO 639-3 code)
 * @property {'ltr' | 'rtl'} ld - Text direction (left-to-right or right-to-left)
 * @property {string} ln - Native name of the language
 * @property {string} lr - Language region (continent or region where the language is spoken)
 * @property {number} pk - Primary key in the database
 */
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

export default function DownloadsScreen() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Repository[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ used: number; total: number } | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { isConnected } = useNetworkState();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (isConnected === false) {
      setError('No internet connection. Please check your network settings.');
      setLoading(false);
    } else if (isConnected === true) {
      loadLanguages();
    }
  }, [isConnected]);

  const loadDownloadedCollections = async () => {
    try {
      setLoading(true);
      // In a real app, this would load from local storage
      const repoManager = RepositoryManager.getInstance();
      const results = await repoManager.searchRepositories('obs');
      setCollections(results);
      setError(null);
    } catch (err) {
      setError('Failed to load downloaded collections. Please try again later.');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStorageInfo = async () => {
    try {
      const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory!);
      if (info.exists && !info.isDirectory) {
        setStorageInfo({
          used: info.size || 0,
          total: 1000000000, // 1GB for example
        });
      } else {
        setStorageInfo({
          used: 0,
          total: 1000000000,
        });
      }
    } catch (err) {
      console.error('Error getting storage info:', err);
      setStorageInfo({
        used: 0,
        total: 1000000000,
      });
    }
  };

  const handleDeleteCollection = async (collection: Repository) => {
    // In a real app, this would delete the collection from local storage
    setCollections(collections.filter((c) => c.id !== collection.id));
  };

  const handleClearAll = async () => {
    // In a real app, this would clear all collections from local storage
    setCollections([]);
  };

  // Group collections by language
  const groupedCollections = collections.reduce((groups: LanguageGroup[], collection) => {
    const existingGroup = groups.find((g) => g.language === collection.language);
    if (existingGroup) {
      existingGroup.collections.push(collection);
    } else {
      groups.push({
        language: collection.language,
        collections: [collection],
      });
    }
    return groups;
  }, []);

  const renderCollectionItem = ({ item }: { item: Repository }) => (
    <View className={`m-2 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {item.displayName}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Version {item.version || '1.0.0'}
          </Text>
          <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Size: 25 MB
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteCollection(item)}>
          <Ionicons
            name="trash-outline"
            size={24}
            className={isDark ? 'text-red-400' : 'text-red-500'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  interface LanguageGroup {
    language: string;
    collections: Repository[];
  }

  const renderLanguageGroup = ({ item }: { item: LanguageGroup }) => (
    <View className="mb-6">
      <Text className={`mb-3 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {item.language}
      </Text>
      <FlatList
        data={item.collections}
        renderItem={renderCollectionItem}
        keyExtractor={(collection) => collection.id.toString()}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />
    </View>
  );

  const loadLanguages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://git.door43.org/api/v1/catalog/list/languages?subject=Open%20Bible%20Stories&stage=prod'
      );
      if (!response.ok) {
        throw new Error(`Failed to load languages: ${response.status}`);
      }

      const data: Language[] = await response.json().then((res) => res.data);
      console.log({ data });
      setLanguages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load languages');
      console.error('Error loading languages:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.ang?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      lang.ln?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      lang.lc?.toLowerCase().includes(searchQuery?.toLowerCase())
  );

  const handleLanguagePress = (language: Language) => {
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'You need an internet connection to browse collections.',
        [{ text: 'OK' }]
      );
      return;
    }
    router.push(`/downloads/${language.lc}`);
  };

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      onPress={() => handleLanguagePress(item)}
      className={`m-2 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {item.ln}
          </Text>
          {item.ln && (
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {item.ang} ({item.lc})
            </Text>
          )}
          <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {item.cc.length ? `${item.cc.length} countries` : ''}
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          className={isDark ? 'text-gray-400' : 'text-gray-500'}
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading languages...
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
          <MaterialIcons
            name="error-outline"
            size={48}
            className={isDark ? 'text-red-400' : 'text-red-500'}
          />
          <Text
            className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadLanguages}
            className={`mt-4 rounded-lg px-6 py-3 ${isDark ? 'bg-blue-900' : 'bg-blue-600'}`}>
            <Text className="font-medium text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View
        className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
        <SearchBar
          placeholder="Search languages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredLanguages}
        renderItem={renderLanguageItem}
        keyExtractor={(item) => item.lc}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
