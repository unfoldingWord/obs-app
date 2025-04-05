import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Load stories based on selected language
  useEffect(() => {
    // This would be an API call in a real app
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setStories(MOCK_STORIES);
      setLoading(false);
    }, 500);
  }, [selectedLanguage]);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  // Render each story item
  const renderStoryItem = ({ item }: { item: Story }) => (
    <TouchableOpacity
      style={styles.storyCard}
      onPress={() => router.push(`/story/${item.language}/${item.id}`)}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.storyThumbnail}
      />
      <View style={styles.storyInfo}>
        <Text style={styles.storyTitle}>{item.title}</Text>
        <Text style={styles.storyDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.storyMeta}>
          <Text style={styles.storyFrameCount}>
            <Ionicons name="images-outline" size={14} /> {item.frameCount} frames
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" style={styles.storyArrow} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Open Bible Stories</Text>
        <View style={styles.languageSelector}>
          {LANGUAGES.map(language => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageButton,
                selectedLanguage === language.code && styles.languageButtonActive
              ]}
              onPress={() => handleLanguageChange(language.code)}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  selectedLanguage === language.code && styles.languageButtonTextActive
                ]}
              >
                {language.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading stories...</Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.storyList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <Link href="/(main)/settings" asChild>
          <TouchableOpacity style={styles.footerButton}>
            <Ionicons name="settings-outline" size={24} color="#555" />
            <Text style={styles.footerButtonText}>Settings</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(main)/downloads" asChild>
          <TouchableOpacity style={styles.footerButton}>
            <Ionicons name="download-outline" size={24} color="#555" />
            <Text style={styles.footerButtonText}>Downloads</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(main)/about" asChild>
          <TouchableOpacity style={styles.footerButton}>
            <Ionicons name="information-circle-outline" size={24} color="#555" />
            <Text style={styles.footerButtonText}>About</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  languageSelector: {
    flexDirection: 'row',
  },
  languageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  languageButtonActive: {
    backgroundColor: '#4a90e2',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#666',
  },
  languageButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4a90e2',
  },
  storyList: {
    padding: 16,
  },
  storyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  storyThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  storyInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  storyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyFrameCount: {
    fontSize: 13,
    color: '#888',
  },
  storyArrow: {
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerButton: {
    alignItems: 'center',
  },
  footerButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: '#555',
  },
});
