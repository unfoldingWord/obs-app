import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
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

import { CollectionsManager, SearchResult, Collection } from '../../src/core/CollectionsManager';

interface HighlightedTextProps {
  text: string;
  isDark: boolean;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, isDark }) => {
  // Parse the highlighted text with <mark> tags
  const parts = text.split(/(<mark>.*?<\/mark>)/g);
  
  return (
    <Text className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      {parts.map((part, index) => {
        if (part.startsWith('<mark>') && part.endsWith('</mark>')) {
          // This is a highlighted part - remove the tags and style it
          const highlightedText = part.replace(/<\/?mark>/g, '');
          return (
            <Text
              key={index}
              style={{
                fontWeight: 'bold',
                backgroundColor: isDark ? '#FEF3C7' : '#FEF3C7', // Yellow background
                color: isDark ? '#92400E' : '#92400E', // Dark yellow text
                paddingHorizontal: 2,
                borderRadius: 2,
              }}>
              {highlightedText}
            </Text>
          );
        } else {
          // Regular text
          return part;
        }
      })}
    </Text>
  );
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useFocusEffect(
    useCallback(() => {
      loadCollections();
    }, [])
  );

  const loadCollections = async () => {
    try {
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.initialize();
      const localCollections = await collectionsManager.getLocalCollections();
      setCollections(localCollections);
      // Initially select all collections
      setSelectedCollections(new Set(localCollections.map(c => c.id)));
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const toggleCollection = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  const selectAllCollections = () => {
    setSelectedCollections(new Set(collections.map(c => c.id)));
  };

  const selectNoneCollections = () => {
    setSelectedCollections(new Set());
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.initialize();
      
      let allResults: SearchResult[] = [];
      
      if (selectedCollections.size === 0) {
        // No collections selected, no results
        setResults([]);
        return;
      } else if (selectedCollections.size === collections.length) {
        // All collections selected, search globally
        allResults = await collectionsManager.searchContent(searchQuery);
      } else {
        // Search in specific collections
        for (const collectionId of selectedCollections) {
          const results = await collectionsManager.searchContent(searchQuery, collectionId);
          allResults.push(...results);
        }
      }
      
      // Sort results by collection name, then story number, then frame number
      allResults.sort((a, b) => {
        if (a.collectionName !== b.collectionName) {
          return a.collectionName.localeCompare(b.collectionName);
        }
        if (a.storyNumber !== b.storyNumber) {
          return a.storyNumber - b.storyNumber;
        }
        return a.frameNumber - b.frameNumber;
      });
      
      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    // Keep collection filters as they are
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
      <HighlightedText text={item.highlightedText} isDark={isDark} />
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
          <View className="flex-1 relative">
            <TextInput
              className={`p-3 rounded-lg pr-10 ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              }`}
              placeholder="Search for text in stories..."
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                className="absolute right-2 top-3 p-1">
                <MaterialIcons
                  name="clear"
                  size={20}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            className={`ml-2 p-3 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
            <MaterialIcons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Collection Filters */}
      {!loadingCollections && collections.length > 0 && (
        <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <MaterialIcons
                name="filter-list"
                size={20}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text className={`ml-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Collections ({selectedCollections.size}/{collections.length})
              </Text>
            </View>
            <MaterialIcons
              name={showFilters ? "expand-less" : "expand-more"}
              size={20}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
          </TouchableOpacity>

          {showFilters && (
            <View className="px-4 pb-4">
              {/* Select All/None buttons */}
              <View className="flex-row mb-3">
                <TouchableOpacity
                  onPress={selectAllCollections}
                  className={`mr-2 px-3 py-1 rounded ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <Text className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    Select All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={selectNoneCollections}
                  className={`px-3 py-1 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select None
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Collection list */}
              <View className="space-y-2">
                {collections.map((collection) => (
                  <TouchableOpacity
                    key={collection.id}
                    onPress={() => toggleCollection(collection.id)}
                    className="flex-row items-center py-2">
                    <MaterialIcons
                      name={selectedCollections.has(collection.id) ? "check-box" : "check-box-outline-blank"}
                      size={20}
                      color={selectedCollections.has(collection.id) 
                        ? (isDark ? '#60A5FA' : '#3B82F6')
                        : (isDark ? '#6B7280' : '#9CA3AF')
                      }
                    />
                    <Text className={`ml-2 flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {collection.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

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
