import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBar } from '../../components/SearchBar';
import { RepositoryManager, Repository } from '../../src/core/repositoryManager';

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
  const { language } = useLocalSearchParams<{ language: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Repository[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageInfo, setLanguageInfo] = useState<Language | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadLanguageInfo();
    loadCollections();
  }, [language]);

  const loadLanguageInfo = async () => {
    try {
      const response = await fetch(
        'https://git.door43.org/api/v1/catalog/list/languages?subject=Open%20Bible%20Stories&stage=prod'
      );
      if (!response.ok) {
        throw new Error(`Failed to load language info: ${response.status}`);
      }

      const data: Language[] = await response.json();
      const langInfo = data.find((lang) => lang.lc === language);
      if (!langInfo) {
        throw new Error('Language not found');
      }
      setLanguageInfo(langInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load language info');
      console.error('Error loading language info:', err);
    }
  };

  const loadCollections = async () => {
    try {
      setLoading(true);
      const repoManager = RepositoryManager.getInstance();
      const results = await repoManager.searchRepositories(language);
      setCollections(results);
      setError(null);
    } catch (err) {
      setError('Failed to load collections. Please try again later.');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter((collection) =>
    collection.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCollectionPress = (collection: Repository) => {
    router.push(`/collections/${collection.id}`);
  };

  const renderCollectionItem = ({ item }: { item: Repository }) => (
    <TouchableOpacity
      onPress={() => handleCollectionPress(item)}
      className={`m-2 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {item.displayName}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Version {item.version || '1.0.0'}
          </Text>
          <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Size: 25 MB
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
            onPress={loadCollections}
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
        <View className="mb-4">
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {languageInfo?.ang}
          </Text>
          {languageInfo?.ln && (
            <Text className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {languageInfo.ln}
            </Text>
          )}
        </View>
        <SearchBar
          placeholder="Search collections..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredCollections}
        renderItem={renderCollectionItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
