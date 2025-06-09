import 'reflect-metadata';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Stack } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

import '../global.css';
import { DatabaseManager } from '@/core/DatabaseManager';
import { DataMigration } from '@/db/migration';

// Enable react-native-screens
enableScreens();

// Use the new unified database
const db = SQLite.openDatabaseSync('app.db');

export default function RootLayout() {
  useDrizzleStudio(db);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize the new unified database
        const databaseManager = DatabaseManager.getInstance();
        await databaseManager.initialize();

        // Run migration from legacy databases if they exist
        const migration = new DataMigration();
        await migration.migrateFromLegacyDatabases();

        console.log('App database initialized and migration completed');
      } catch (error) {
        console.error('Failed to initialize app database:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 bg-white dark:bg-gray-800">
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}
