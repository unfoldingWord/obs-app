import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

interface AddCommentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  initialText?: string;
  title?: string;
  isDark: boolean;
}

export const AddCommentModal: React.FC<AddCommentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialText = '',
  title = 'Add Comment',
  isDark,
}) => {
  const [commentText, setCommentText] = useState(initialText);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCommentText(initialText);
    }
  }, [visible, initialText]);

  const handleSubmit = async () => {
    const trimmedText = commentText.trim();

    if (!trimmedText) {
      Alert.alert('Error', 'Please enter a comment before submitting.');
      return;
    }

    if (trimmedText.length > 1000) {
      Alert.alert('Error', 'Comment is too long. Please keep it under 1000 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(trimmedText);
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCommentText('');
    onClose();
  };

  const getCharacterCountColor = () => {
    const length = commentText.length;
    if (length > 950) return '#EF4444'; // Red
    if (length > 900) return '#F59E0B'; // Yellow
    return isDark ? '#6B7280' : '#9CA3AF'; // Gray
  };

  const getCharacterCountIcon = () => {
    const length = commentText.length;
    if (length > 950) return 'error';
    if (length > 900) return 'warning';
    return 'info';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Modern Header with Icon-based Design */}
          <View
            className={`flex-row items-center justify-between px-6 py-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={handleClose}
              className={`rounded-full p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
            >
              <MaterialIcons
                name="close"
                size={20}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>

            {/* Title with Icon */}
            <View className="flex-row items-center gap-2">
              <MaterialIcons
                name="edit-note"
                size={24}
                color={isDark ? '#60A5FA' : '#3B82F6'}
              />
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title === 'Add Comment' ? '' : ''}
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !commentText.trim()}
              className={`rounded-full p-3 ${
                isSubmitting || !commentText.trim()
                  ? isDark ? 'bg-gray-800' : 'bg-gray-200'
                  : isDark ? 'bg-blue-600' : 'bg-blue-500'
              }`}
            >
              <MaterialIcons
                name={isSubmitting ? 'hourglass-empty' : 'check'}
                size={20}
                color={
                  isSubmitting || !commentText.trim()
                    ? isDark ? '#4B5563' : '#9CA3AF'
                    : '#FFFFFF'
                }
              />
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View className="flex-1 p-6">
            {/* Text Input with Modern Design */}
            <View
              className={`flex-1 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}
            >
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                multiline
                textAlignVertical="top"
                className={`flex-1 p-6 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
                style={{ minHeight: 200 }}
                maxLength={1000}
                autoFocus
              />
            </View>

            {/* Bottom Stats Bar */}
            <View className="flex-row items-center justify-between mt-4">
              {/* Character Count with Icon */}
              <View className="flex-row items-center gap-2">
                <MaterialIcons
                  name={getCharacterCountIcon()}
                  size={16}
                  color={getCharacterCountColor()}
                />
                <Text
                  className="text-sm font-medium"
                  style={{ color: getCharacterCountColor() }}
                >
                  {commentText.length}/1000
                </Text>
              </View>

              {/* Progress Indicator */}
              <View className="flex-row items-center gap-3">
                {/* Progress Dots */}
                <View className="flex-row gap-1">
                  {[...Array(5)].map((_, index) => {
                    const threshold = (index + 1) * 200;
                    const isActive = commentText.length >= threshold;
                    return (
                      <View
                        key={index}
                        className={`h-1.5 w-6 rounded-full ${
                          isActive
                            ? commentText.length > 900
                              ? 'bg-red-500'
                              : commentText.length > 700
                                ? 'bg-yellow-500'
                                : isDark ? 'bg-blue-500' : 'bg-blue-600'
                            : isDark ? 'bg-gray-700' : 'bg-gray-300'
                        }`}
                      />
                    );
                  })}
                </View>

                {/* Submission Status Icon */}
                {commentText.trim() && (
                  <View
                    className={`rounded-full p-1.5 ${
                      commentText.length > 950
                        ? 'bg-red-500/20'
                        : commentText.length > 900
                          ? 'bg-yellow-500/20'
                          : isDark ? 'bg-green-500/20' : 'bg-green-500/20'
                    }`}
                  >
                    <MaterialIcons
                      name={
                        commentText.length > 950
                          ? 'error'
                          : commentText.length > 900
                            ? 'warning'
                            : 'check-circle'
                      }
                      size={12}
                      color={
                        commentText.length > 950
                          ? '#EF4444'
                          : commentText.length > 900
                            ? '#F59E0B'
                            : '#10B981'
                      }
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
