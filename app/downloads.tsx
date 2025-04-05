import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Language } from '../src/types/index';

// Mock data for downloaded content
const MOCK_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', downloaded: true },
  { code: 'es', name: 'Spanish', downloaded: true },
  { code: 'fr', name: 'French', downloaded: false },
];

// Mock downloaded stories by language
const MOCK_DOWNLOADED_STORIES = {
  en: [
    { id: '01', title: 'The Creation', size: '2.4 MB' },
    { id: '02', title: 'Sin Enters the World', size: '1.8 MB' },
    { id: '03', title: 'The Flood', size: '2.1 MB' },
    { id: '04', title: 'God\'s Covenant with Abraham', size: '1.9 MB' },
  ],
  es: [
    { id: '01', title: 'La Creación', size: '2.3 MB' },
    { id: '02', title: 'El Pecado Entra en el Mundo', size: '1.7 MB' },
  ],
  fr: [],
};

export default function DownloadsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [totalSize, setTotalSize] = useState('0 MB');

  // Load downloaded content
  useEffect(() => {
    // In a real app, this would load from your storage system
    setTimeout(() => {
      setLanguages(MOCK_LANGUAGES);
      setTotalSize('8.5 MB');
      setIsLoading(false);
    }, 500);
  }, []);

  // Create data for the section list
  const getSectionData = () => {
    return languages
      .filter(lang => lang.downloaded)
      .map(lang => ({
        title: lang.name,
        code: lang.code,
        data: MOCK_DOWNLOADED_STORIES[lang.code as keyof typeof MOCK_DOWNLOADED_STORIES] || [],
      }));
  };

  const handleDeleteStory = (languageCode: string, storyId: string) => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story? You can download it again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would delete the story from storage
            Alert.alert('Story deleted');
          },
        },
      ]
    );
  };

  const handleClearAllDownloads = () => {
    Alert.alert(
      'Clear All Downloads',
      'Are you sure you want to delete all downloaded stories? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would clear all downloads
            Alert.alert('All downloads cleared');
            setTotalSize('0 MB');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading downloads...</Text>
      </View>
    );
  }

  const sections = getSectionData();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Downloaded Content</Text>
        <Text style={styles.storageInfo}>
          <Ionicons name="disc" size={16} color="#4a90e2" /> Storage used: {totalSize}
        </Text>
      </View>

      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.id}`}
          renderItem={({ item, section }) => (
            <View style={styles.storyItem}>
              <View style={styles.storyInfo}>
                <Text style={styles.storyTitle}>{item.title}</Text>
                <Text style={styles.storyMeta}>
                  <Ionicons name="document" size={12} color="#888" /> {item.size}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteStory(section.code, item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No downloaded content</Text>
            </View>
          }
          stickySectionHeadersEnabled={true}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No downloaded content</Text>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => router.push('/languages')}
          >
            <Text style={styles.downloadButtonText}>Browse Languages</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        {sections.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAllDownloads}
          >
            <Ionicons name="trash" size={18} color="#fff" />
            <Text style={styles.clearButtonText}>Clear All Downloads</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => router.push('/languages')}
        >
          <Ionicons name="download" size={18} color="#4a90e2" />
          <Text style={styles.manageButtonText}>Download More Content</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  storageInfo: {
    fontSize: 14,
    color: '#666',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    fontWeight: 'bold',
    fontSize: 16,
  },
  storyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  storyMeta: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    marginBottom: 24,
  },
  downloadButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  clearButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  manageButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  manageButtonText: {
    color: '#4a90e2',
    fontWeight: '500',
    marginLeft: 8,
  },
});
