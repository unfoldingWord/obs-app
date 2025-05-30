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
import { NotesSection } from '../../src/components/CommentsSection';
import { FrameBadge } from '../../src/components/FrameBadge';

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
      className={`mx-4 mb-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-lg ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>

      <View className="flex-row items-center justify-between mb-3">
        <Text
          className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
          numberOfLines={1}
          style={{ flex: 1, marginRight: 12 }}>
          {item.storyTitle}
        </Text>
        <FrameBadge
          storyNumber={item.storyNumber}
          frameNumber={item.frameNumber}
          size="compact"
          showIcon={false}
        />
      </View>

      <Text className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {item.collectionName}
      </Text>

      <HighlightedText text={item.highlightedText} isDark={isDark} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Search Header */}
      <View className={`px-6 pt-6 pb-4 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <View className="flex-row items-center">
          <View className="flex-1 relative">
            <MaterialIcons
              name="search"
              size={20}
              color={isDark ? '#6B7280' : '#9CA3AF'}
              style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}
            />
            <TextInput
              className={`p-4 pl-12 rounded-2xl pr-12 text-base ${
                isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
              } shadow-sm`}
              placeholder=""
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                className="absolute right-3 top-3 p-1">
                <MaterialIcons
                  name="clear"
                  size={24}
                  color={isDark ? '#6B7280' : '#9CA3AF'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Collection Filters */}
      {!loadingCollections && collections.length > 0 && (
        <View className={`mx-6 mb-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <MaterialIcons
                name="tune"
                size={24}
                color={isDark ? '#60A5FA' : '#3B82F6'}
              />
              <Text className={`ml-3 text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedCollections.size}
              </Text>
            </View>
            <MaterialIcons
              name={showFilters ? "expand-less" : "expand-more"}
              size={24}
              color={isDark ? '#6B7280' : '#9CA3AF'}
            />
          </TouchableOpacity>

          {showFilters && (
            <View className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
              {/* Select All/None buttons */}
              <View className="flex-row mt-4 mb-4">
                <TouchableOpacity
                  onPress={selectAllCollections}
                  className={`mr-3 px-4 py-3 rounded-xl flex-row items-center ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
                  <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={selectNoneCollections}
                  className={`px-4 py-3 rounded-xl flex-row items-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <MaterialIcons name="radio-button-unchecked" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>

              {/* Collection list */}
              <View>
                {collections.map((collection) => (
                  <TouchableOpacity
                    key={collection.id}
                    onPress={() => toggleCollection(collection.id)}
                    className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <MaterialIcons
                      name={selectedCollections.has(collection.id) ? "check-circle" : "radio-button-unchecked"}
                      size={20}
                      color={selectedCollections.has(collection.id)
                        ? (isDark ? '#60A5FA' : '#3B82F6')
                        : (isDark ? '#6B7280' : '#9CA3AF')
                      }
                    />
                    <Text className={`ml-3 flex-1 text-sm ${
                      selectedCollections.has(collection.id)
                        ? (isDark ? 'text-white' : 'text-gray-900')
                        : (isDark ? 'text-gray-400' : 'text-gray-500')
                    }`}>
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
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      ) : searchQuery ? (
        <View className="flex-1 items-center justify-center">
          <MaterialIcons
            name="search-off"
            size={64}
            color={isDark ? '#374151' : '#D1D5DB'}
          />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <MaterialIcons
            name="search"
            size={64}
            color={isDark ? '#374151' : '#D1D5DB'}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
