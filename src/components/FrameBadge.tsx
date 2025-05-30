import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, useColorScheme } from 'react-native';

interface FrameBadgeProps {
  storyNumber: number;
  frameNumber: number;
  isFavorite?: boolean;
  size?: 'small' | 'compact' | 'medium' | 'large';
  isRTL?: boolean;
  showIcon?: boolean;
}

export const FrameBadge: React.FC<FrameBadgeProps> = ({
  storyNumber,
  frameNumber,
  isFavorite = false,
  size = 'medium',
  isRTL = false,
  showIcon = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'px-2 py-0.5',
          text: 'text-xs',
          iconSize: 12,
          favoriteSize: 12,
        };
      case 'compact':
        return {
          container: 'px-3 py-1',
          text: 'text-sm',
          iconSize: 14,
          favoriteSize: 14,
        };
      case 'large':
        return {
          container: 'px-4 py-1.5',
          text: 'text-base',
          iconSize: 18,
          favoriteSize: 18,
        };
      default: // medium
        return {
          container: 'px-3 py-1',
          text: 'text-sm',
          iconSize: 16,
          favoriteSize: 16,
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <View
      className={`inline-flex flex-row items-center rounded-full ${sizeClasses.container} ${
        isDark ? 'bg-gray-800' : 'bg-gray-100'
      } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
      style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignSelf: isRTL ? 'flex-end' : 'flex-start',
      }}>
      {showIcon && (
        <MaterialIcons
          name="auto-stories"
          size={sizeClasses.iconSize}
          color={isDark ? '#9CA3AF' : '#6B7280'}
          style={{
            marginRight: isRTL ? 0 : 4,
            marginLeft: isRTL ? 4 : 0,
          }}
        />
      )}
      <Text
        className={`${sizeClasses.text} font-medium ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}
        style={{ textAlign: isRTL ? 'right' : 'left' }}>
        {storyNumber}:{frameNumber}
      </Text>
      {isFavorite && (
        <MaterialIcons
          name="favorite"
          size={sizeClasses.favoriteSize}
          color="#EF4444"
          style={{
            marginLeft: isRTL ? 0 : 6,
            marginRight: isRTL ? 6 : 0,
          }}
        />
      )}
    </View>
  );
};
