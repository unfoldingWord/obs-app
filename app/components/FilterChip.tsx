import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';

interface FilterChipProps {
  label: string;
  selected: boolean;
  count?: number;
  onPress: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  count,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mr-2 px-3 py-1 rounded-full flex-row items-center ${
        selected
          ? isDark
            ? 'bg-blue-900'
            : 'bg-blue-100'
          : isDark
          ? 'bg-gray-700'
          : 'bg-gray-100'
      }`}
    >
      <Text
        className={`text-sm ${
          selected
            ? isDark
              ? 'text-blue-400'
              : 'text-blue-600'
            : isDark
            ? 'text-gray-400'
            : 'text-gray-600'
        }`}
      >
        {label}
      </Text>
      {count !== undefined && (
        <View
          className={`ml-1 px-1 rounded-full ${
            selected
              ? isDark
                ? 'bg-blue-800'
                : 'bg-blue-200'
              : isDark
              ? 'bg-gray-600'
              : 'bg-gray-200'
          }`}
        >
          <Text
            className={`text-xs ${
              selected
                ? isDark
                  ? 'text-blue-300'
                  : 'text-blue-700'
                : isDark
                ? 'text-gray-300'
                : 'text-gray-700'
            }`}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default FilterChip;
