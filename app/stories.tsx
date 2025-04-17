import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '../components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { RepositoryManager, Repository } from '../src/core/repositoryManager';

interface LanguageGroup {
  language: string;
  collections: Repository[];
}

export default function StoriesScreen() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Repository[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const repoManager = RepositoryManager.getInstance();
      const results = await repoManager.searchRepositories('obs');
      setCollections(results);
      setError(null);
    } catch (err) {
      setError('Failed to load story collections. Please try again later.');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group collections by language
  const groupedCollections = collections.reduce((groups: LanguageGroup[], collection) => {
    const existingGroup = groups.find(g => g.language === collection.language);
    if (existingGroup) {
      existingGroup.collections.push(collection);
    } else {
      groups.push({
        language: collection.language,
        collections: [collection]
      });
    }
    return groups;
  }, []);

  // Filter collections based on search query
  const filteredGroups = groupedCollections.filter(group => {
    return group.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
           group.collections.some(collection =>
             collection.displayName.toLowerCase().includes(searchQuery.toLowerCase())
           );
  });

  const handleCollectionPress = (collection: Repository) => {
    router.push(`/story/${collection.owner}/${collection.language}`);
  };

  const renderCollectionItem = ({ item }: { item: Repository }) => (
    <TouchableOpacity
      className={`m-2 p-4 rounded-lg ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}
      onPress={() => handleCollectionPress(item)}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className={`text-lg font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {item.displayName}
          </Text>
          <Text className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Version {item.version || '1.0.0'}
          </Text>
          {item.lastUpdated && (
            <Text className={`text-xs ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Updated {new Date(item.lastUpdated).toLocaleDateString()}
            </Text>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={24}
          className={isDark ? 'text-gray-400' : 'text-gray-300'}
        />
      </View>
    </TouchableOpacity>
  );

  const renderLanguageGroup = ({ item }: { item: LanguageGroup }) => (
    <View className="mb-6">
      <Text className={`text-xl font-bold mb-3 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>
        {item.language}
      </Text>
      <FlatList
        data={item.collections}
        renderItem={renderCollectionItem}
        keyExtractor={collection => collection.id.toString()}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${
        isDark ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`mt-4 text-lg ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Loading story collections...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className={`flex-1 ${
        isDark ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons
            name="alert-circle"
            size={48}
            className={isDark ? 'text-red-400' : 'text-red-500'}
          />
          <Text className={`mt-4 text-lg text-center ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadCollections}
            className={`mt-4 px-6 py-3 rounded-lg ${
              isDark ? 'bg-blue-900' : 'bg-blue-600'
            }`}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${
      isDark ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View className={`p-4 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <SearchBar
          placeholder="Search by language or collection..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredGroups}
        renderItem={renderLanguageGroup}
        keyExtractor={group => group.language}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
