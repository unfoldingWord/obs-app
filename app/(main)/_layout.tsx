import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MainLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#fff' : '#4a90e2',
        tabBarInactiveTintColor: isDark ? '#888' : '#888',
        tabBarStyle: {
          backgroundColor: isDark ? '#121212' : '#fff',
          borderTopColor: isDark ? '#333' : '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: isDark ? '#121212' : '#fff',
        },
        headerTintColor: isDark ? '#fff' : '#000',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: { color: string, size: number }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="stories"
        options={{
          title: 'Stories',
          tabBarIcon: ({ color, size }: { color: string, size: number }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="languages"
        options={{
          title: 'Languages',
          tabBarIcon: ({ color, size }: { color: string, size: number }) => (
            <Ionicons name="globe" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Downloads',
          tabBarIcon: ({ color, size }: { color: string, size: number }) => (
            <Ionicons name="download" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }: { color: string, size: number }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, size }: { color: string, size: number }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
          href: null, // Hide this tab from the tab bar
        }}
      />
    </Tabs>
  );
}
