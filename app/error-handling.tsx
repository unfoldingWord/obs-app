import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';

export default function ErrorHandlingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Note: Error details are now logged to console instead of stored in AsyncStorage
  useEffect(() => {
    // Since we no longer store error details in AsyncStorage,
    // this screen serves as a generic error handler
    console.log('Error handling screen loaded');
  }, []);

  const handleGoHome = () => {
    router.replace('/(tabs)/(read)');
  };

  const handleRetry = () => {
    // Simply go back to collections - no retry logic needed since errors are rare
    handleGoHome();
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <View className="flex-1 items-center justify-center p-6">
        {/* Error Icon */}
        <View className={`mb-6 rounded-full p-6 ${isDark ? 'bg-red-600/20' : 'bg-red-500/10'}`}>
          <MaterialIcons name="error-outline" size={64} color={isDark ? '#F87171' : '#EF4444'} />
        </View>

        {/* Title */}
        <Text
          className={`mb-4 text-center text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          URL Processing Error
        </Text>

        {/* Description */}
        <Text
          className={`mb-6 text-center text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          There was an issue processing the incoming URL. This shouldn't happen often.
        </Text>

        {/* Action Buttons */}
        <View className="w-full max-w-sm space-y-3">
          <TouchableOpacity
            onPress={handleRetry}
            className={`rounded-xl px-6 py-4 ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text className="ml-2 text-base font-semibold text-white">Try Again</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoHome}
            className={`rounded-xl px-6 py-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="home" size={20} color={isDark ? '#D1D5DB' : '#374151'} />
              <Text
                className={`ml-2 text-base font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Go to Collections
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
