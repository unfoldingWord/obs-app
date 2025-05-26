import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { CollectionsManager, Frame } from '../../../src/core/CollectionsManager';

export default function TestFrameViewerScreen() {
  const [collectionId, setCollectionId] = useState('unfoldingword/en_obs'); // Default for testing
  const [storyNumberStr, setStoryNumberStr] = useState('1');
  const [frameNumberStr, setFrameNumberStr] = useState('1');

  const [frame, setFrame] = useState<Frame | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const manager = CollectionsManager.getInstance();

  const handleLoadFrame = async () => {
    const storyNum = parseInt(storyNumberStr, 10);
    const frameNum = parseInt(frameNumberStr, 10);

    if (!collectionId.trim()) {
      Alert.alert('Error', 'Collection ID is required.');
      return;
    }
    if (isNaN(storyNum) || storyNum <= 0) {
      Alert.alert('Error', 'Story Number must be a positive integer.');
      return;
    }
    if (isNaN(frameNum) || frameNum <= 0) {
      Alert.alert('Error', 'Frame Number must be a positive integer.');
      return;
    }

    setLoading(true);
    setError(null);
    setFrame(null);

    try {
      // Ensure manager is initialized (it should be a singleton, but re-initializing is safe)
      await manager.initialize();
      const loadedFrame = await manager.getFrame(collectionId, storyNum, frameNum);

      if (loadedFrame) {
        setFrame(loadedFrame);
      } else {
        setError(`Frame not found for \nCollection: ${collectionId} \nStory: ${storyNum}, Frame: ${frameNum}`);
      }
    } catch (e: any) {
      console.error('Failed to load frame:', e);
      setError(`Error loading frame: ${e.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F3F4F6',
    },
    scrollContainer: {
      padding: 16,
    },
    input: {
      height: 40,
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
      borderWidth: 1,
      marginBottom: 12,
      paddingHorizontal: 8,
      borderRadius: 4,
      color: isDark ? '#FFFFFF' : '#000000',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    label: {
      fontSize: 16,
      marginBottom: 4,
      color: isDark ? '#D1D5DB' : '#374151',
    },
    frameImage: {
      width: '100%',
      height: 250,
      resizeMode: 'contain',
      marginBottom: 12,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
    },
    frameText: {
      fontSize: 16,
      lineHeight: 24,
      color: isDark ? '#FFFFFF' : '#1F2937',
    },
    errorText: {
      color: isDark ? '#FCA5A5' : '#EF4444',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 12,
    },
    infoText: {
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      marginVertical: 20,
    },
    buttonContainer: {
      marginVertical: 10,
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Test Frame Viewer' }} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Collection ID:</Text>
        <TextInput
          style={styles.input}
          value={collectionId}
          onChangeText={setCollectionId}
          placeholder="e.g., unfoldingword/en_obs"
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        />

        <Text style={styles.label}>Story Number:</Text>
        <TextInput
          style={styles.input}
          value={storyNumberStr}
          onChangeText={setStoryNumberStr}
          placeholder="e.g., 1"
          keyboardType="number-pad"
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        />

        <Text style={styles.label}>Frame Number:</Text>
        <TextInput
          style={styles.input}
          value={frameNumberStr}
          onChangeText={setFrameNumberStr}
          placeholder="e.g., 1"
          keyboardType="number-pad"
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        />

        <View style={styles.buttonContainer}>
          <Button title="Load Frame" onPress={handleLoadFrame} disabled={loading} color={isDark ? '#3B82F6' : '#2563EB'} />
        </View>

        {loading && <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} style={{ marginVertical: 20 }} />}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {frame && (
          <View>
            <Text style={[styles.label, { marginTop: 20, marginBottom: 8, textAlign: 'center' }]}>Frame Content:</Text>
            <Image source={{ uri: frame.imageUrl }} style={styles.frameImage} />
            <Text style={styles.frameText}>{frame.text}</Text>
          </View>
        )}

        {!loading && !error && !frame && (
          <Text style={styles.infoText}>Enter details and click "Load Frame" to see content.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
