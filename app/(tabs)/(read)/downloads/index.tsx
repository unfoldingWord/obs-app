import { MaterialIcons } from '@expo/vector-icons';
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
  const [error, setError] = useState<string | null>(null);
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

      {/* Header with back button */}
      <View
        className={`flex-row items-center px-4 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#9CA3AF' : '#374151'} />
        </TouchableOpacity>
        <Text className={`flex-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Download Collections
        </Text>
      </View>

      {/* Search bar */}
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
