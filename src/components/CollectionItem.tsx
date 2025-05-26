import { hashStringToNumber } from 'core/hashStringToNumber';
import { useObsImage } from 'hooks/useObsImage';
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

import { Collection } from '../core/CollectionsManager';

interface CollectionItemProps {
  item: Collection;
  onPress: (collection: Collection) => void;
  isDark: boolean;
}

export function CollectionItem({ item, onPress, isDark }: CollectionItemProps) {
  const image = useObsImage({
    reference: { story: hashStringToNumber(item.id), frame: 1 },
  });

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className={`rounded-lg4 mb-2 flex-row p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Image
        source={image}
        style={{ width: 64, height: 64, borderRadius: 8, marginRight: 16 }}
        resizeMode="cover"
      />

      {/* Content on the right */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.displayName}
        </Text>
        <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {item.metadata?.description || 'Open Bible Stories'}
        </Text>
        <Text className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Language: {item.language} • Owner: {item.owner}
        </Text>
        <Text className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Version: {item.version}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
