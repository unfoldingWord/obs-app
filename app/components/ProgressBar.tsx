import React from 'react';
import { View, Text, useColorScheme } from 'react-native';

interface ProgressBarProps {
  progress: number;
  status: 'downloading' | 'sharing' | 'preparing';
  size?: number;
  timeRemaining?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status,
  size,
  timeRemaining,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getStatusColor = () => {
    switch (status) {
      case 'downloading':
        return isDark ? 'bg-blue-500' : 'bg-blue-600';
      case 'sharing':
        return isDark ? 'bg-green-500' : 'bg-green-600';
      case 'preparing':
        return isDark ? 'bg-gray-500' : 'bg-gray-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'downloading':
        return 'Downloading';
      case 'sharing':
        return 'Sharing';
      case 'preparing':
        return 'Preparing';
    }
  };

  return (
    <View className="w-full">
      <View className="flex-row justify-between mb-1">
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {getStatusText()}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <View
          className={`h-full rounded-full ${getStatusColor()}`}
          style={{ width: `${progress * 100}%` }}
        />
      </View>
      {(size || timeRemaining) && (
        <View className="flex-row justify-between mt-1">
          {size && (
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatSize(size)}
            </Text>
          )}
          {timeRemaining && (
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {timeRemaining} remaining
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const formatSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};
