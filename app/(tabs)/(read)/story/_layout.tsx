import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function StoryLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#000' : '#f5f5f5',
        },
      }}
    />
  );
}
