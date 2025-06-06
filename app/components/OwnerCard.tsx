import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';

interface OwnerCardProps {
  name: string;
  collectionCount: number;
  lastUpdated: Date;
  onPress: () => void;
}

export const OwnerCard: React.FC<OwnerCardProps> = ({
  name,
  collectionCount,
  lastUpdated,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mb-2 rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="flex-row items-center justify-between">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {collectionCount} collections
        </Text>
      </View>
      <Text className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Last updated: {formatDate(lastUpdated)}
      </Text>
    </TouchableOpacity>
  );
};

export default OwnerCard;
