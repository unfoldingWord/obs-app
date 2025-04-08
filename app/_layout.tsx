import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
          },
          headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000' : '#f5f5f5',
          },
        }}
      >
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen
          name="story/[language]/[id]"
          options={{
            headerShown: true,
            headerBackTitle: "Back",
            headerTitle: "Historia"
          }}
        />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
