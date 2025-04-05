import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock language data
const MOCK_LANGUAGES = [
  { code: 'en', name: 'English', downloaded: true },
  { code: 'es', name: 'Spanish', downloaded: true },
  { code: 'fr', name: 'French', downloaded: false },
  { code: 'de', name: 'German', downloaded: false },
  { code: 'pt', name: 'Portuguese', downloaded: false },
  { code: 'ru', name: 'Russian', downloaded: false },
  { code: 'zh', name: 'Chinese', downloaded: false },
  { code: 'ar', name: 'Arabic', downloaded: false },
  { code: 'hi', name: 'Hindi', downloaded: false },
  { code: 'ja', name: 'Japanese', downloaded: false },
];

export default function LanguagesScreen() {
  const [languages, setLanguages] = useState(MOCK_LANGUAGES);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter languages based on search query
  const filteredLanguages = languages.filter(
    lang =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderLanguage = ({ item }: { item: typeof MOCK_LANGUAGES[0] }) => (
    <Link href={`/stories?language=${item.code}`} asChild>
      <TouchableOpacity
        style={[
          styles.languageCard,
          item.downloaded && styles.languageDownloaded
        ]}
      >
        <View style={styles.languageInfo}>
          <Text style={styles.languageCode}>{item.code.toUpperCase()}</Text>
          <Text style={styles.languageName}>{item.name}</Text>
        </View>

        <View style={styles.languageStatus}>
          {item.downloaded ? (
            <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
          ) : (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={(e) => {
                e.stopPropagation();
                // In a real app, this would trigger a download
                Alert.alert(`Downloading ${item.name}`);
              }}
            >
              <Ionicons name="cloud-download" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search languages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredLanguages}
        renderItem={renderLanguage}
        keyExtractor={item => item.code}
        contentContainerStyle={styles.languagesList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="language" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No languages found</Text>
          </View>
        }
      />

      <Link href="/repository" asChild>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Repository</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  languagesList: {
    padding: 16,
  },
  languageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  languageDownloaded: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  languageInfo: {
    flex: 1,
  },
  languageCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  languageName: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  languageStatus: {
    marginLeft: 12,
  },
  downloadButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 16,
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a90e2',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
