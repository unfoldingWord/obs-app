import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, TextInput, useColorScheme } from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`flex-row items-center rounded-lg px-3 py-2 ${
        isDark ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
      <MaterialIcons
        name="search"
        size={20}
        className={isDark ? 'text-gray-400' : 'text-gray-500'}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
        className={`ml-2 flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
      />
      {value.length > 0 && (
        <MaterialIcons
          name="clear"
          size={20}
          className={isDark ? 'text-gray-400' : 'text-gray-500'}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
};

export default SearchBar;
