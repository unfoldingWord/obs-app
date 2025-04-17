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
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FavoriteStory {
  id: string;
  title: string;
  thumbnailUrl: string;
  lastRead: Date;
}

interface Marker {
  id: string;
  storyId: string;
  storyTitle: string;
  frame: number;
  note: string;
  createdAt: Date;
}

export default function FavoritesScreen() {
  const [activeTab, setActiveTab] = useState<'stories' | 'markers'>('stories');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Mock data - in a real app this would come from local storage
  const favoriteStories: FavoriteStory[] = [
    {
      id: '01',
      title: 'The Creation',
      thumbnailUrl: 'https://cdn.door43.org/obs/jpg/360px/obs-en-01-01.jpg',
      lastRead: new Date(),
    },
  ];

  const markers: Marker[] = [
    {
      id: '1',
      storyId: '01',
      storyTitle: 'The Creation',
      frame: 5,
      note: 'God created light',
      createdAt: new Date(),
    },
  ];

  const renderFavoriteStory = ({ item }: { item: FavoriteStory }) => (
    <TouchableOpacity
      onPress={() => router.push(`/story/${item.id}`)}
      className={`m-2 rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Image source={{ uri: item.thumbnailUrl }} className="w-full h-32" />
      <View className="p-4">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.title}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Last read: {item.lastRead.toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMarker = ({ item }: { item: Marker }) => (
    <TouchableOpacity
      onPress={() => router.push(`/story/${item.storyId}?frame=${item.frame}`)}
      className={`m-2 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {item.storyTitle}
      </Text>
      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Frame {item.frame}
      </Text>
      <Text className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {item.note}
      </Text>
      <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        Created: {item.createdAt.toLocaleDateString()}
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
          Favorites
        </Text>
        <View className="flex-row mt-4">
          <TouchableOpacity
            onPress={() => setActiveTab('stories')}
            className={`flex-1 py-2 rounded-l-lg ${
              activeTab === 'stories'
                ? isDark ? 'bg-blue-600' : 'bg-blue-500'
                : isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
            <Text
              className={`text-center ${
                activeTab === 'stories'
                  ? 'text-white'
                  : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Stories
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('markers')}
            className={`flex-1 py-2 rounded-r-lg ${
              activeTab === 'markers'
                ? isDark ? 'bg-blue-600' : 'bg-blue-500'
                : isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
            <Text
              className={`text-center ${
                activeTab === 'markers'
                  ? 'text-white'
                  : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Markers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'stories' ? (
        favoriteStories.length > 0 ? (
          <FlatList
            data={favoriteStories}
            renderItem={renderFavoriteStory}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <MaterialIcons
              name="favorite-border"
              size={48}
              className={isDark ? 'text-gray-400' : 'text-gray-500'}
            />
            <Text className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No favorite stories yet
            </Text>
          </View>
        )
      ) : markers.length > 0 ? (
        <FlatList
          data={markers}
          renderItem={renderMarker}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center p-4">
          <MaterialIcons
            name="bookmark-border"
            size={48}
            className={isDark ? 'text-gray-400' : 'text-gray-500'}
          />
          <Text className={`mt-4 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No markers yet
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
