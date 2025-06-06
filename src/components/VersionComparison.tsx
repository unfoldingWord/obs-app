import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text } from 'react-native';

// Version status types
type VersionStatus = 'new' | 'same' | 'upgrade' | 'downgrade';

interface VersionComparisonProps {
  collectionName: string;
  ownerName: string;
  currentVersion: string;
  newVersion: string;
  versionStatus: VersionStatus;
  isDark: boolean;
}

export const VersionComparison: React.FC<VersionComparisonProps> = ({
  collectionName,
  ownerName,
  currentVersion,
  newVersion,
  versionStatus,
  isDark,
}) => {
  const isUpgrade = versionStatus === 'upgrade';
  const isDowngrade = versionStatus === 'downgrade';

  if (!isUpgrade && !isDowngrade) return null;

  return (
    <View className="mt-2 max-w-64">
      {/* Collection Name */}
      <Text
        className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
        numberOfLines={2}>
        {collectionName}
      </Text>

      {/* Owner Name */}
      <Text
        className={`mt-1 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
        numberOfLines={1}>
        {ownerName}
      </Text>

      {/* Version Transition */}
      <View className="mt-4 items-center">
        <View className="items-center space-y-3">
          {/* Current Version (always on top) */}
          <View className="items-center">
            <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentVersion || '?'}
            </Text>
          </View>

          {/* Downward Arrow */}
          <MaterialIcons name="arrow-downward" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />

          {/* New Version (always on bottom) */}
          <View className="items-center">
            <View className="flex-row items-center">
              <Text
                className={`${isUpgrade ? 'text-lg font-bold' : 'text-base font-medium'} ${
                  isUpgrade
                    ? isDark
                      ? 'text-green-400'
                      : 'text-green-600'
                    : isDark
                      ? 'text-amber-400'
                      : 'text-amber-600'
                }`}>
                {newVersion}
              </Text>

              {/* Circled arrow indicating upgrade/downgrade */}
              <View
                className={`ml-2 rounded-full p-1 ${
                  isUpgrade
                    ? isDark
                      ? 'bg-green-600/20'
                      : 'bg-green-500/20'
                    : isDark
                      ? 'bg-amber-600/20'
                      : 'bg-amber-500/20'
                }`}>
                <MaterialIcons
                  name={isUpgrade ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={12}
                  color={
                    isUpgrade ? (isDark ? '#10B981' : '#059669') : isDark ? '#F59E0B' : '#D97706'
                  }
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Collection Information Component (for same/new version modals)
interface CollectionInfoProps {
  collectionName: string;
  ownerName: string;
  version: string;
  versionStatus: VersionStatus;
  isDark: boolean;
}

export const CollectionInfo: React.FC<CollectionInfoProps> = ({
  collectionName,
  ownerName,
  version,
  versionStatus,
  isDark,
}) => {
  return (
    <View className="mt-2 max-w-64">
      {/* Collection Name */}
      <Text
        className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
        numberOfLines={2}>
        {collectionName}
      </Text>

      {/* Owner Name */}
      <Text
        className={`mt-1 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
        numberOfLines={1}>
        {ownerName}
      </Text>

      {/* Version */}
      <View className="mt-4 items-center">
        <View className="flex-row items-center">
          <Text
            className={`text-lg font-bold ${
              versionStatus === 'same'
                ? isDark
                  ? 'text-green-400'
                  : 'text-green-600'
                : isDark
                  ? 'text-sky-400'
                  : 'text-sky-600'
            }`}>
            {version}
          </Text>

          {/* Status indicator */}
          <View
            className={`ml-2 rounded-full p-1 ${
              versionStatus === 'same'
                ? isDark
                  ? 'bg-green-600/20'
                  : 'bg-green-500/20'
                : isDark
                  ? 'bg-sky-600/20'
                  : 'bg-sky-500/20'
            }`}>
            <MaterialIcons
              name={versionStatus === 'same' ? 'check-circle' : 'library-books'}
              size={12}
              color={
                versionStatus === 'same'
                  ? isDark
                    ? '#10B981'
                    : '#059669'
                  : isDark
                    ? '#0EA5E9'
                    : '#0284C7'
              }
            />
          </View>
        </View>
      </View>
    </View>
  );
};
