import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollectionsManager, SearchResult } from '../../src/core/CollectionsManager';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.initialize();
      const searchResults = await collectionsManager.searchContent(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      onPress={() => router.push(`/story/${encodeURIComponent(item.collectionId)}/${item.storyNumber}/${item.frameNumber}`)}
      className={`m-2 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {item.storyTitle}
      </Text>
      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {item.collectionName} - Frame {item.frameNumber}
      </Text>
      <Text className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {item.text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Search Stories
        </Text>
        <View className="flex-row mt-4">
          <TextInput
            className={`flex-1 p-3 rounded-lg ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
            placeholder="Search for text in stories..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            onPress={handleSearch}
            className={`ml-2 p-3 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
            <MaterialIcons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Searching...
          </Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
        />
      ) : searchQuery ? (
        <View className="flex-1 items-center justify-center p-4">
          <MaterialIcons
            name="search-off"
            size={48}
            className={isDark ? 'text-gray-400' : 'text-gray-500'}
          />
          <Text className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No results found
          </Text>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center p-4">
          <MaterialIcons
            name="search"
            size={48}
            className={isDark ? 'text-gray-400' : 'text-gray-500'}
          />
          <Text className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Enter a search term to find content in stories
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
