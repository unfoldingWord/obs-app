import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

interface Language {
  code: string;
  name: string;
  localized: string;
  downloaded: boolean;
  stories: number;
}

// Mock data for available languages
const MOCK_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    localized: 'English',
    downloaded: true,
    stories: 50
  },
  {
    code: 'es',
    name: 'Spanish',
    localized: 'Español',
    downloaded: true,
    stories: 50
  },
  {
    code: 'fr',
    name: 'French',
    localized: 'Français',
    downloaded: false,
    stories: 50
  },
  {
    code: 'de',
    name: 'German',
    localized: 'Deutsch',
    downloaded: false,
    stories: 50
  },
  {
    code: 'zh',
    name: 'Chinese',
    localized: '中文',
    downloaded: false,
    stories: 45
  },
  {
    code: 'ar',
    name: 'Arabic',
    localized: 'العربية',
    downloaded: false,
    stories: 48
  },
  {
    code: 'ru',
    name: 'Russian',
    localized: 'Русский',
    downloaded: false,
    stories: 50
  },
  {
    code: 'pt',
    name: 'Portuguese',
    localized: 'Português',
    downloaded: false,
    stories: 50
  },
  {
    code: 'hi',
    name: 'Hindi',
    localized: 'हिन्दी',
    downloaded: false,
    stories: 43
  },
];

export default function LanguagesScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  // Load languages
  useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      setLanguages(MOCK_LANGUAGES);
      setIsLoading(false);
    }, 800);
  }, []);

  const handleDownload = (language: Language) => {
    // If already downloaded, show a message
    if (language.downloaded) {
      Alert.alert(
        'Already Downloaded',
        `${language.name} is already downloaded and available for offline use.`
      );
      return;
    }

    // Start download process
    setDownloading(language.code);

    // Simulate download completion after a delay
    setTimeout(() => {
      setLanguages(prevLanguages =>
        prevLanguages.map(lang =>
          lang.code === language.code
            ? { ...lang, downloaded: true }
            : lang
        )
      );
      setDownloading(null);

      Alert.alert(
        'Download Complete',
        `${language.name} has been downloaded and is now available for offline use.`
      );
    }, 2500);
  };

  // Filter languages based on search
  const filteredLanguages = searchQuery.trim() === ''
    ? languages
    : languages.filter(lang =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.localized.toLowerCase().includes(searchQuery.toLowerCase())
      );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading languages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Languages</Text>
        <Text style={styles.headerSubtitle}>
          Download languages for offline use
        </Text>
      </View>

      <FlatList
        data={filteredLanguages}
        keyExtractor={item => item.code}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.languageItem}>
            <View style={styles.languageInfo}>
              <Text style={styles.languageName}>{item.name}</Text>
              <Text style={styles.languageLocalized}>{item.localized}</Text>
              <Text style={styles.languageMeta}>
                <Ionicons name="book-outline" size={12} color="#888" /> {item.stories} stories
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.downloadButton,
                item.downloaded && styles.downloadedButton,
                downloading === item.code && styles.downloadingButton,
              ]}
              onPress={() => handleDownload(item)}
              disabled={downloading !== null}
            >
              {downloading === item.code ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={item.downloaded ? "checkmark" : "download"}
                    size={16}
                    color={item.downloaded ? "#4a90e2" : "#fff"}
                  />
                  <Text
                    style={[
                      styles.downloadButtonText,
                      item.downloaded && styles.downloadedButtonText,
                    ]}
                  >
                    {item.downloaded ? 'Downloaded' : 'Download'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
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
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  languageLocalized: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  languageMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  downloadedButton: {
    backgroundColor: '#e0f0ff',
  },
  downloadingButton: {
    backgroundColor: '#81b0ea',
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 5,
  },
  downloadedButtonText: {
    color: '#4a90e2',
  },
});
