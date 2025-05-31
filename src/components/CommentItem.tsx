import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { FrameComment } from '../core/CommentsManager';

interface CommentItemProps {
  comment: FrameComment;
  onEdit: () => void;
  onDelete: () => void;
  isDark: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onEdit, onDelete, isDark }) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isEdited = comment.updatedAt.getTime() !== comment.createdAt.getTime();

  return (
    <View
      className={`mx-4 mb-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border shadow-sm ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
      <View className="flex-row items-start justify-between">
        <View className="mr-4 flex-1">
          <Text className={`text-base leading-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {comment.comment}
          </Text>
          <View className="mt-3 flex-row items-center">
            <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatDate(comment.createdAt)}
            </Text>
            {isEdited && (
              <>
                <Text className={`mx-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  •
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  edited
                </Text>
              </>
            )}
          </View>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={onEdit}
            className={`mr-2 rounded-full p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} shadow-sm`}>
            <MaterialIcons name="edit" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            className={`rounded-full p-3 ${isDark ? 'bg-red-600/20' : 'bg-red-50'} shadow-sm`}>
            <MaterialIcons name="delete" size={16} color={isDark ? '#F87171' : '#EF4444'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
