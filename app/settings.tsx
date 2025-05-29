import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CollectionsManager } from '../src/core/CollectionsManager';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [highQualityImages, setHighQualityImages] = useState(false);
  const [storageUsage, setStorageUsage] = useState('0 MB');
  const [isCleaningOwners, setIsCleaningOwners] = useState(false);

  // In a real app, these would be loaded from the SettingsManager
  useEffect(() => {
    // Simulate loading settings
    setStorageUsage('154 MB');
  }, []);

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached images?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would call the cache clearing function
            Alert.alert('Cache cleared');
            setStorageUsage('0 MB');
          }
        }
      ]
    );
  };

  const cleanupOrphanedOwners = async () => {
    Alert.alert(
      'Clean Up Owner Records',
      'This will remove owner records that are no longer associated with any collections. This is safe and can help reduce database size.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up',
          onPress: async () => {
            try {
              setIsCleaningOwners(true);
              const collectionsManager = CollectionsManager.getInstance();
              await collectionsManager.initialize();
              const removedCount = await collectionsManager.cleanupOrphanedOwners();
              
              if (removedCount > 0) {
                Alert.alert('Success', `Cleaned up ${removedCount} orphaned owner records.`);
              } else {
                Alert.alert('No Cleanup Needed', 'No orphaned owner records were found.');
              }
            } catch (error) {
              console.error('Error cleaning up orphaned owners:', error);
              Alert.alert('Error', 'Failed to clean up owner records. Please try again.');
            } finally {
              setIsCleaningOwners(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon" size={22} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingName}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#d3d3d3', true: '#81b0ff' }}
            thumbColor={darkMode ? '#4a90e2' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="cloud-download" size={22} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingName}>Auto-download Stories</Text>
          </View>
          <Switch
            value={autoDownload}
            onValueChange={setAutoDownload}
            trackColor={{ false: '#d3d3d3', true: '#81b0ff' }}
            thumbColor={autoDownload ? '#4a90e2' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="image" size={22} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingName}>High-quality Images</Text>
          </View>
          <Switch
            value={highQualityImages}
            onValueChange={setHighQualityImages}
            trackColor={{ false: '#d3d3d3', true: '#81b0ff' }}
            thumbColor={highQualityImages ? '#4a90e2' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>

        <View style={styles.storageInfo}>
          <Text style={styles.storageLabel}>Current Usage:</Text>
          <Text style={styles.storageValue}>{storageUsage}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={clearCache}>
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.buttonText}>Clear Image Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.maintenanceButton]} 
          onPress={cleanupOrphanedOwners}
          disabled={isCleaningOwners}
        >
          <Ionicons 
            name={isCleaningOwners ? "hourglass" : "construct"} 
            size={18} 
            color="#fff" 
          />
          <Text style={styles.buttonText}>
            {isCleaningOwners ? 'Cleaning...' : 'Clean Up Owner Records'}
          </Text>
        </TouchableOpacity>

        <Link href="/storage" asChild>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
            <Ionicons name="folder-open" size={18} color="#4a90e2" />
            <Text style={styles.secondaryButtonText}>Manage Storage</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle" size={22} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingName}>App Version</Text>
          </View>
          <Text style={styles.versionText}>1.0.0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="globe" size={22} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingName}>Website</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="document-text" size={22} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingName}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#aaa" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingName: {
    fontSize: 16,
    color: '#333',
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 16,
  },
  storageLabel: {
    fontSize: 16,
    color: '#333',
  },
  storageValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  secondaryButtonText: {
    color: '#4a90e2',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#888',
  },
  maintenanceButton: {
    backgroundColor: '#4a90e2',
  },
});
