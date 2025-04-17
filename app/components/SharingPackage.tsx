import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SharingPackage {
  id: string;
  collections: string[];
  size: number;
  created: Date;
  sharedWith: string[];
  status: 'preparing' | 'ready' | 'sharing' | 'completed';
}

interface SharingPackageProps {
  package: SharingPackage;
  onPress: () => void;
  onShare: () => void;
}

export const SharingPackage: React.FC<SharingPackageProps> = ({
  package: pkg,
  onPress,
  onShare,
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

  const getStatusIcon = () => {
    switch (pkg.status) {
      case 'ready':
        return 'check-circle';
      case 'sharing':
        return 'hourglass-empty';
      case 'completed':
        return 'done-all';
      default:
        return 'hourglass-empty';
    }
  };

  const getStatusColor = () => {
    switch (pkg.status) {
      case 'ready':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'sharing':
        return isDark ? 'text-blue-400' : 'text-blue-600';
      case 'completed':
        return isDark ? 'text-green-400' : 'text-green-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`p-4 mb-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <MaterialIcons
            name={getStatusIcon()}
            size={24}
            className={getStatusColor()}
          />
          <Text className={`ml-2 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Package {pkg.id}
          </Text>
        </View>
        <TouchableOpacity onPress={onShare}>
          <MaterialIcons
            name="share"
            size={24}
            className={isDark ? 'text-gray-400' : 'text-gray-600'}
          />
        </TouchableOpacity>
      </View>
      <View className="mt-2">
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {pkg.collections.length} collections • {formatSize(pkg.size)}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Created: {formatDate(pkg.created)}
        </Text>
        {pkg.sharedWith.length > 0 && (
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Shared with: {pkg.sharedWith.join(', ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
