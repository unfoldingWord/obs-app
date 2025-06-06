import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';

export interface LoadingModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  title?: string;
  children?: React.ReactNode;
}

export default function LoadingModal({
  visible,
  onClose,
  isDark,
  title = 'Loading',
  children,
}: LoadingModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <View className="flex-1 items-center justify-center bg-black/50" style={{ zIndex: 9999 }}>
        <View
          className={`mx-6 overflow-hidden rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-2xl ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ elevation: 20, zIndex: 10000, minWidth: 200, minHeight: 200 }}>
          {/* Header with loading spinner */}
          <View className={`items-center ${title || children ? 'p-6' : 'p-4'}`}>
            <View
              className={`${title || children ? 'mb-4' : 'mb-0'} rounded-full p-4 ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/10'}`}>
              <ActivityIndicator size={32} color={isDark ? '#60A5FA' : '#3B82F6'} />
            </View>

            {title && (
              <Text
                className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </Text>
            )}

            {/* Custom children content */}
            {children}
          </View>

          {/* Action buttons */}
          <View
            className="flex-row border-t"
            style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity
              onPress={onClose}
              className={`flex-1 items-center justify-center py-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <MaterialIcons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
