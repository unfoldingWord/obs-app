import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CollectionCardProps {
  title: string;
  version: string;
  lastUpdated: Date;
  downloadStatus: 'not_downloaded' | 'downloading' | 'downloaded' | 'update_available';
  shareStatus?: 'not_shared' | 'sharing' | 'shared';
  onPress: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  title,
  version,
  lastUpdated,
  downloadStatus,
  shareStatus,
  onPress,
  onDownload,
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

  const getDownloadIcon = () => {
    switch (downloadStatus) {
      case 'downloaded':
        return 'check-circle';
      case 'downloading':
        return 'hourglass-empty';
      case 'update_available':
        return 'update';
      default:
        return 'download';
    }
  };

  const getDownloadColor = () => {
    switch (downloadStatus) {
      case 'downloaded':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'downloading':
        return isDark ? 'text-blue-400' : 'text-blue-600';
      case 'update_available':
        return isDark ? 'text-orange-400' : 'text-orange-600';
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
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </Text>
        <View className="flex-row space-x-2">
          <TouchableOpacity onPress={onDownload}>
            <MaterialIcons
              name={getDownloadIcon()}
              size={24}
              className={getDownloadColor()}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShare}>
            <MaterialIcons
              name="share"
              size={24}
              className={isDark ? 'text-gray-400' : 'text-gray-600'}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View className="mt-2">
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Version: {version}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Last updated: {formatDate(lastUpdated)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CollectionCard;
