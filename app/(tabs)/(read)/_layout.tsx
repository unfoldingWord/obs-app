import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

export default function ReadLayout() {
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
          title: 'Read',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="downloads"
        options={{
          title: 'Downloads',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="stories"
        options={{
          title: 'Stories',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
