import { Stack } from 'expo-router';
import React from 'react';

export default function StoryMainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
