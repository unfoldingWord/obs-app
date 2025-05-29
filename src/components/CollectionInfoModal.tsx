import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Collection, CollectionsManager } from '../core/CollectionsManager';

interface CollectionInfoModalProps {
  collection: Collection | null;
  visible: boolean;
  onClose: () => void;
  onCollectionDeleted?: () => void;
  isDark?: boolean;
}

export const CollectionInfoModal: React.FC<CollectionInfoModalProps> = ({
  collection,
  visible,
  onClose,
  onCollectionDeleted,
  isDark = false,
}) => {
  if (!collection) return null;

  const handleDeleteCollection = async () => {
    Alert.alert(
      "Delete Collection",
      `Are you sure you want to delete "${collection.displayName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const collectionsManager = CollectionsManager.getInstance();
              await collectionsManager.deleteCollection(collection.id);
              onClose();
              onCollectionDeleted?.();
            } catch (error) {
              console.error('Error deleting collection:', error);
              Alert.alert(
                'Error',
                'Failed to delete collection. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  const handleExportCollection = () => {
    // TODO: Implement export functionality
    Alert.alert(
      'Export Collection',
      'Export functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <View className="flex-row justify-between items-center">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Collection Info
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={isDark ? '#9CA3AF' : '#374151'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {collection.displayName}
          </Text>
          <Text className={`text-gray-600 mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {collection.owner.fullName || collection.owner.username}
          </Text>

          <View className="mt-4 space-y-2">
            <InfoRow
              label="Language"
              value={collection.language}
              isDark={isDark}
            />
            <InfoRow
              label="Version"
              value={collection.version}
              isDark={isDark}
            />
            <InfoRow
              label="Last Updated"
              value={collection.lastUpdated.toLocaleDateString()}
              isDark={isDark}
            />
            <InfoRow
              label="Status"
              value={collection.isDownloaded ? 'Downloaded' : 'Not Downloaded'}
              isDark={isDark}
            />
          </View>

          {collection.metadata?.description && (
            <View className="mt-4">
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Description:
              </Text>
              <Text className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {collection.metadata.description}
              </Text>
            </View>
          )}

          <View className="mt-6 space-y-3">
            {collection.isDownloaded && (
              <>
                <TouchableOpacity
                  onPress={handleExportCollection}
                  className={`p-3 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
                >
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons name="share" size={20} color="white" />
                    <Text className="text-white text-center font-semibold ml-2">
                      Export Collection
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteCollection}
                  className={`p-3 rounded-lg ${isDark ? 'bg-red-600' : 'bg-red-500'}`}
                >
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons name="delete" size={20} color="white" />
                    <Text className="text-white text-center font-semibold ml-2">
                      Delete Collection
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  isDark: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, isDark }) => (
  <View className="flex-row justify-between items-center py-1">
    <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      {label}:
    </Text>
    <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
      {value}
    </Text>
  </View>
);
