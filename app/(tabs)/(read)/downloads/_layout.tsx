import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

export default function DownloadsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#000000',
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Downloads',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[language]"
        options={{
          title: 'Available Stories',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
