import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function StoryLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#121212' : '#fff',
        },
        headerTintColor: isDark ? '#fff' : '#000',
        headerBackTitle: 'Back',
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: isDark ? '#000' : '#f5f5f5',
        },

      }}
      options={{
        headerShown: false,
      }}
    />
  );
}
