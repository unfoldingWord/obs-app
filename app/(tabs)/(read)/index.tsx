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
import { Link, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RepositoryManager, Repository } from '../../../src/core/repositoryManager';

// Types
interface Story {
  id: string;
  title: string;
  description: string;
  language: string;
  thumbnailUrl: string;
  frameCount: number;
}

// Mock data - This would come from your API in a real app
const MOCK_STORIES: Story[] = [
  {
    id: '01',
    title: 'The Creation',
    description: 'This is how God made everything in the beginning.',
    language: 'en',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-01.jpg',
    frameCount: 16,
  },
  {
    id: '02',
    title: 'Sin Enters the World',
    description: 'Adam and Eve disobeyed God.',
    language: 'en',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-02-01.jpg',
    frameCount: 12,
  },
  {
    id: '03',
    title: 'The Flood',
    description: 'God decided to destroy the whole world with a flood because the people were so evil.',
    language: 'en',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-03-01.jpg',
    frameCount: 14,
  },
  {
    id: '04',
    title: "God's Covenant with Abraham",
    description: 'God made a covenant with Abraham.',
    language: 'en',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-04-01.jpg',
    frameCount: 15,
  },
  {
    id: '05',
    title: 'The Son of Promise',
    description: 'God fulfilled his promise to Abraham.',
    language: 'en',
    thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-05-01.jpg',
    frameCount: 10,
  },
];

// Available languages
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

export default function ReadScreen() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Repository[]>([]);
  const [lastReadStory, setLastReadStory] = useState<{
    id: string;
    title: string;
    frame: number;
  } | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadCollections();
    // In a real app, this would load from local storage
    setLastReadStory({
      id: '01',
      title: 'The Creation',
      frame: 5,
    });
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const repoManager = RepositoryManager.getInstance();
      const results = await repoManager.searchRepositories('obs');
      setCollections(results);
    } catch (err) {
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no collections are downloaded, show the downloads screen
  if (collections.length === 0) {
    router.replace('/downloads');
    return null;
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Continue Reading
        </Text>
      </View>

      {lastReadStory ? (
        <View className="flex-1 p-4">
          <TouchableOpacity
            onPress={() => router.push(`/story/${lastReadStory.id}`)}
            className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <Image
              source={{ uri: `https://cdn.door43.org/obs/jpg/360px/obs-en-${lastReadStory.id}-${lastReadStory.frame.toString().padStart(2, '0')}.jpg` }}
              className="w-full h-48"
            />
            <View className="p-4">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lastReadStory.title}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Frame {lastReadStory.frame}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/downloads')}
            className={`mt-4 rounded-lg p-4 ${isDark ? 'bg-blue-900' : 'bg-blue-600'}`}>
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="add" size={24} color="white" />
              <Text className="ml-2 text-center font-medium text-white">
                Download New Story
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center p-4">
          <MaterialIcons
            name="book"
            size={48}
            className={isDark ? 'text-gray-400' : 'text-gray-500'}
          />
          <Text className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No stories read yet
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/downloads')}
            className={`mt-4 rounded-lg px-6 py-3 ${isDark ? 'bg-blue-900' : 'bg-blue-600'}`}>
            <Text className="font-medium text-white">Download a Story</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
