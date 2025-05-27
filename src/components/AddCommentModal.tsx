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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View
            className={`flex-row items-center justify-between p-4 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <TouchableOpacity onPress={handleClose}>
              <Text className={`text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                Cancel
              </Text>
            </TouchableOpacity>

            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </Text>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !commentText.trim()}
              className={`px-3 py-1 rounded ${
                isSubmitting || !commentText.trim()
                  ? isDark ? 'bg-gray-700' : 'bg-gray-300'
                  : isDark ? 'bg-blue-600' : 'bg-blue-500'
              }`}
            >
              <Text
                className={`font-medium ${
                  isSubmitting || !commentText.trim()
                    ? isDark ? 'text-gray-500' : 'text-gray-500'
                    : 'text-white'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="flex-1 p-4">
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write your comment here..."
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              multiline
              textAlignVertical="top"
              className={`flex-1 p-3 text-base rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              style={{ minHeight: 120 }}
              maxLength={1000}
              autoFocus
            />

            {/* Character Count */}
            <View className="flex-row justify-between items-center mt-2">
              <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {commentText.length}/1000 characters
              </Text>

              {commentText.length > 900 && (
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="warning"
                    size={16}
                    color={commentText.length > 950 ? '#EF4444' : '#F59E0B'}
                  />
                  <Text
                    className={`ml-1 text-sm ${
                      commentText.length > 950 ? 'text-red-500' : 'text-yellow-500'
                    }`}
                  >
                    {commentText.length > 950 ? 'Almost at limit' : 'Getting long'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
