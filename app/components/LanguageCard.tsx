import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';

interface LanguageCardProps {
  language: string;
  region?: string;
  family?: string;
  collectionCount: number;
  ownerCount: number;
  onPress: () => void;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
  language,
  region,
  family,
  collectionCount,
  ownerCount,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`p-4 mb-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
    >
      <View className="flex-row justify-between items-center">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {language}
        </Text>
        <View className="flex-row space-x-2">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {collectionCount} collections
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {ownerCount} owners
          </Text>
        </View>
      </View>
      {(region || family) && (
        <View className="mt-2 flex-row space-x-2">
          {region && (
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {region}
            </Text>
          )}
          {family && (
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {family}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};
