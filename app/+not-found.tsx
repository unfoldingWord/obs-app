import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isChecking, setIsChecking] = useState(true);

  console.log('🔍 404: NotFoundScreen');

  useEffect(() => {
    // Since we now use +native-intent.tsx to intercept URLs before they reach the 404 route,
    // this component should only handle actual 404 errors (not file imports)
    console.log('🔍 404: Real 404 detected - URL not intercepted by +native-intent.tsx');
    setIsChecking(false);
  }, []);

  // Show loading spinner while checking
  if (isChecking) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
      </View>
    );
  }

  // Show clean 404 page with icon only
  return (
    <View className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <MaterialIcons name="error-outline" size={80} color={isDark ? '#374151' : '#9CA3AF'} />
    </View>
  );
}
