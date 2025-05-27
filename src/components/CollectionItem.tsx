import { MaterialIcons } from '@expo/vector-icons';
import { hashStringToNumber } from 'core/hashStringToNumber';
import { useObsImage } from 'hooks/useObsImage';
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

import { CollectionInfoModal } from './CollectionInfoModal';
import { Collection, CollectionsManager } from '../core/CollectionsManager';

interface CollectionItemProps {
  item: Collection;
  onPress: (collection: Collection) => void;
  onCollectionDeleted?: () => void;
  isDark: boolean;
}

export function CollectionItem({
  item,
  onPress,
  onCollectionDeleted,
  isDark,
}: CollectionItemProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const image = useObsImage({
    reference: { story: hashStringToNumber(item.id), frame: 1 },
  });

  const handleShowInfo = () => {
    setShowInfoModal(true);
  };

  const handleCloseInfo = () => {
    setShowInfoModal(false);
  };

  const handleDeleteCollection = async () => {
    Alert.alert('Delete Collection', `Are you sure you want to delete ${item.displayName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true);
            const collectionsManager = CollectionsManager.getInstance();
            await collectionsManager.deleteCollection(item.id);
            onCollectionDeleted?.();
          } catch (err) {
            console.error('Delete failed:', err);
            Alert.alert(
              'Delete Failed',
              'There was an error deleting this collection. Please try again.',
              [{ text: 'OK' }]
            );
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const handleCollectionDeletedFromModal = () => {
    setShowInfoModal(false);
    onCollectionDeleted?.();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => onPress(item)}
        className={`m-2 flex-row items-center rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <Image
          source={image}
          style={{ width: 64, height: 64, borderRadius: 8, marginRight: 16 }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {item.displayName}
          </Text>
          <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            ID: {item.id}
          </Text>
          <Text className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Owner: {item.owner}
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleShowInfo();
          }}
          className={`mr-2 rounded-full p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <MaterialIcons name="info" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>

        <MaterialIcons
          name="chevron-right"
          size={24}
          color={isDark ? '#60A5FA' : '#3B82F6'}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      <CollectionInfoModal
        collection={item}
        visible={showInfoModal}
        onClose={handleCloseInfo}
        onCollectionDeleted={handleCollectionDeletedFromModal}
        isDark={isDark}
      />
    </>
  );
}
