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

import { SearchBar } from '@/components/SearchBar';

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

    // Pass the entire language object as query parameters
    const languageParams = new URLSearchParams({
      lc: language.lc,
      ln: language.ln || '',
      ang: language.ang || '',
      ld: language.ld || 'ltr',
      gw: language.gw ? 'true' : 'false',
      hc: language.hc || '',
      lr: language.lr || '',
      pk: language.pk.toString(),
      alt: JSON.stringify(language.alt || []),
      cc: JSON.stringify(language.cc || []),
    });

    router.push(`/downloads/${language.lc}?${languageParams.toString()}`);
  };

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      onPress={() => handleLanguagePress(item)}
      className={`mx-3 mb-4 overflow-hidden rounded-2xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
      style={{ elevation: 8 }}>
      <View className="p-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            {/* Language Icon */}
            <View
              className={`mr-4 rounded-full p-3 ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/10'}`}>
              <MaterialIcons
                name={item.gw ? 'language' : 'translate'}
                size={24}
                color={isDark ? '#60A5FA' : '#3B82F6'}
              />
            </View>

            {/* Language Info */}
            <View className="flex-1">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.ln || item.ang}
              </Text>
              {item.ln && item.ang && item.ln !== item.ang && (
                <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {item.ang}
                </Text>
              )}
              {/* Language Code Badge */}
              <View className="mt-2 flex-row items-center">
                <View
                  className={`rounded-full px-3 py-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Text
                    className={`font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {item.lc.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Chevron */}
          <View className={`rounded-full p-2 ${isDark ? 'bg-gray-600/30' : 'bg-gray-200/50'}`}>
            <MaterialIcons name="chevron-right" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center">
          <View
            className={`rounded-2xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-xl ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
            <MaterialIcons
              name="language"
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
            <View
              className={`mb-6 rounded-3xl p-6 ${isDark ? 'bg-red-600/20' : 'bg-red-500/10'} border ${isDark ? 'border-red-600/30' : 'border-red-500/20'}`}>
              <MaterialIcons name="cloud-off" size={48} color={isDark ? '#F87171' : '#EF4444'} />
            </View>
            <TouchableOpacity
              onPress={loadLanguages}
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

      {/* Header */}
      <View
        className={`px-6 py-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className={`mr-4 rounded-full p-2 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <MaterialIcons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#374151'} />
            </TouchableOpacity>
            <View className="flex-row items-center">
              <MaterialIcons name="download" size={28} color={isDark ? '#60A5FA' : '#3B82F6'} />
              <View
                className={`ml-3 rounded-full px-3 py-1 ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/10'}`}>
                <Text
                  className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                  {filteredLanguages.length}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Search */}
      <View className={`px-6 py-4 ${isDark ? 'bg-gray-900/50' : 'bg-white/50'}`}>
        <SearchBar placeholder="" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <FlatList
        data={filteredLanguages}
        renderItem={renderLanguageItem}
        keyExtractor={(item) => item.lc}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}
      />
    </SafeAreaView>
  );
}
