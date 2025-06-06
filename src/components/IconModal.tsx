import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

export interface IconModalButton {
  icon: string;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  renderContent?: (isDark: boolean) => React.ReactNode;
}

export interface IconModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  iconBorderColor?: string;
  title?: string;
  message?: string;
  buttons: IconModalButton[];
  children?: React.ReactNode;
}

export const IconModal: React.FC<IconModalProps> = ({
  visible,
  onClose,
  isDark,
  icon,
  iconColor,
  iconBgColor,
  iconBorderColor,
  title,
  message,
  buttons,
  children,
}) => (
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
        style={{ elevation: 20, zIndex: 10000 }}>
        {/* Header with icon */}
        <View className="items-center p-6">
          <View
            className={`mb-4 rounded-full p-4 ${iconBgColor} ${iconBorderColor ? `border ${iconBorderColor}` : ''}`}>
            <MaterialIcons name={icon as any} size={32} color={iconColor} />
          </View>

          {/* Optional title */}
          {title && (
            <Text
              className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
              numberOfLines={2}>
              {title}
            </Text>
          )}

          {/* Optional message */}
          {message && (
            <Text
              className={`mt-2 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              numberOfLines={3}>
              {message}
            </Text>
          )}

          {/* Custom children content */}
          {children}
        </View>

        {/* Action buttons */}
        <View className="flex-row border-t" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
          {buttons.map((button, index) => (
            <TouchableOpacity
              key={index}
              onPress={button.onPress}
              className={`flex-1 items-center justify-center py-4 ${
                button.backgroundColor ||
                (index === 0 && buttons.length > 1
                  ? `${isDark ? 'bg-gray-700' : 'bg-gray-50'}`
                  : '')
              } ${index === 0 && buttons.length > 1 ? 'border-r' : ''}`}
              style={
                buttons.length > 1 && index === 0
                  ? { borderRightWidth: 1, borderRightColor: isDark ? '#374151' : '#E5E7EB' }
                  : {}
              }>
              {button.renderContent ? (
                button.renderContent(isDark)
              ) : (
                <MaterialIcons
                  name={button.icon as any}
                  size={24}
                  color={button.color || (isDark ? '#9CA3AF' : '#6B7280')}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  </Modal>
);
