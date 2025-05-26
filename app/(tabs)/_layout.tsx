import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

interface TabBarIconProps {
  color: string;
  size: number;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      initialRouteName="(read)"
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#60A5FA' : '#3B82F6',
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
        tabBarStyle: {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderTopColor: isDark ? '#374151' : '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#000000',
    }}>
      <Tabs.Screen
        name="(read)"
        options={{
          title: 'Read',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialIcons name="book" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialIcons name="favorite" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialIcons name="search" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="(files)"
        options={{
          title: 'Files',
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <MaterialIcons name="folder" size={size} color={color} />
          ),
          headerShown: false,
          href: null,
        }}
      />
    </Tabs>
  );
}
