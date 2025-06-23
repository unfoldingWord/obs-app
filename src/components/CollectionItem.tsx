import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

import { CollectionInfoModal } from '@/components/CollectionInfoModal';
import { Collection } from '@/core/CollectionsManager';
import { UnifiedLanguagesManager } from '@/core/UnifiedLanguagesManager';
import { hashStringToNumber } from '@/core/hashStringToNumber';
import { useObsImage } from '@/hooks/useObsImage';

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
  const [languageName, setLanguageName] = useState<string>('');
  const [isRTL, setIsRTL] = useState(false);

  const image = useObsImage({
    reference: { story: hashStringToNumber(item.id), frame: 1 },
  });

  useEffect(() => {
    const loadLanguageData = async () => {
      try {
        const languagesManager = UnifiedLanguagesManager.getInstance();
        await languagesManager.initialize();

        const languageData = await languagesManager.getLanguage(item.language);
        if (languageData) {
          setLanguageName(languageData.ln || item.language);
          setIsRTL(languageData.ld === 'rtl');
        } else {
          setLanguageName(item.language);
          setIsRTL(false);
        }
      } catch (error) {
        console.error('Error loading language data:', error);
        setLanguageName(item.language);
        setIsRTL(false);
      }
    };

    loadLanguageData();
  }, [item.language]);

  const handleShowInfo = () => {
    setShowInfoModal(true);
  };

  const handleCloseInfo = () => {
    setShowInfoModal(false);
  };

  const handleCollectionDeletedFromModal = () => {
    setShowInfoModal(false);
    onCollectionDeleted?.();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => onPress(item)}
        className={`mb-4 flex-row items-center rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-sm ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <Image
          source={image}
          style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            marginRight: 16,
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <View className="flex-row items-center justify-between">
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text
                className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {item.displayName}
              </Text>
              <View
                className="mt-2"
                style={{
                  alignItems: isRTL ? 'flex-end' : 'flex-start',
                }}>
                <Text
                  className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                  numberOfLines={1}>
                  {item.owner.fullName || item.owner.username}
                </Text>
                <Text
                  className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                  numberOfLines={1}>
                  {languageName} ({item.language})
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleShowInfo();
              }}
              className={`rounded-full p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <MaterialIcons name="info" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <CollectionInfoModal
        collection={{ ...item, isValid: true }}
        visible={showInfoModal}
        onClose={handleCloseInfo}
        onCollectionDeleted={handleCollectionDeletedFromModal}
        isDark={isDark}
      />
    </>
  );
}
