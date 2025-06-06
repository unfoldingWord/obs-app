import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, useColorScheme } from 'react-native';

interface QualityBadgeProps {
  verified: boolean;
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({ verified }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`flex-row items-center rounded-full px-2 py-1 ${
        verified
          ? isDark
            ? 'bg-green-900'
            : 'bg-green-100'
          : isDark
            ? 'bg-gray-700'
            : 'bg-gray-100'
      }`}>
      <MaterialIcons
        name={verified ? 'verified' : 'warning'}
        size={16}
        className={
          verified
            ? isDark
              ? 'text-green-400'
              : 'text-green-600'
            : isDark
              ? 'text-gray-400'
              : 'text-gray-600'
        }
      />
      <Text
        className={`ml-1 text-xs ${
          verified
            ? isDark
              ? 'text-green-400'
              : 'text-green-600'
            : isDark
              ? 'text-gray-400'
              : 'text-gray-600'
        }`}>
        {verified ? 'Verified' : 'Unverified'}
      </Text>
    </View>
  );
};

export default QualityBadge;
