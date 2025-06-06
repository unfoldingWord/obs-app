import { Stack } from 'expo-router';
import React from 'react';

export default function StoryRedirectLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
