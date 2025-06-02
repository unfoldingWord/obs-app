import React from 'react';
import { Stack } from 'expo-router';

export default function StoryMainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
} 