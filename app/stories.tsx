import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock data for stories
const MOCK_STORIES = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1).padStart(2, '0'),
  title: `Story ${i + 1}`,
  downloaded: Math.random() > 0.3, // Randomly determine if story is downloaded
}));

export default function StoriesScreen() {
  const [stories, setStories] = useState<typeof MOCK_STORIES>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const params = useLocalSearchParams();

  useEffect(() => {
    // In a real app, this would load stories based on selected language
    if (params.language) {
      setSelectedLanguage(String(params.language));
    }

    // Load stories (mocked data for now)
    setStories(MOCK_STORIES);
  }, [params.language]);

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const renderStory = ({ item }: { item: typeof MOCK_STORIES[0] }) => (
    <Link href={`/story/${selectedLanguage}/${item.id}`} asChild>
      <TouchableOpacity
        style={[
          styles.storyCard,
          viewMode === 'list' && styles.storyCardList,
          !item.downloaded && styles.storyCardNotDownloaded
        ]}
      >
        <View style={styles.storyNumber}>
          <Text style={styles.storyNumberText}>{item.id}</Text>
        </View>
        <View style={styles.storyContent}>
          <Text style={styles.storyTitle}>
            {item.title}
          </Text>
          {!item.downloaded && (
            <View style={styles.downloadIndicator}>
              <Ionicons name="cloud-download" size={16} color="#888" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Stories ({selectedLanguage.toUpperCase()})
        </Text>
        <TouchableOpacity onPress={toggleViewMode} style={styles.viewToggle}>
          <Ionicons
            name={viewMode === 'grid' ? 'list' : 'grid'}
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={stories}
        renderItem={renderStory}
        keyExtractor={item => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when changing view mode
        contentContainerStyle={styles.storiesList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewToggle: {
    padding: 8,
  },
  storiesList: {
    padding: 12,
  },
  storyCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  storyCardList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyCardNotDownloaded: {
    opacity: 0.7,
  },
  storyNumber: {
    width: 50,
    height: 50,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  storyContent: {
    padding: 12,
    flex: 1,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  downloadIndicator: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
