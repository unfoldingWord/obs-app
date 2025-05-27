import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FrameComment } from '../core/CommentsManager';

interface CommentItemProps {
  comment: FrameComment;
  onEdit: () => void;
  onDelete: () => void;
  isDark: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onEdit,
  onDelete,
  isDark,
}) => {
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
      className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className={`text-base ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {comment.comment}
          </Text>
          <View className="flex-row items-center mt-2">
            <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {formatDate(comment.createdAt)}
            </Text>
            {isEdited && (
              <>
                <Text className={`text-xs mx-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  •
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  edited
                </Text>
              </>
            )}
          </View>
        </View>

        <View className="flex-row">
          <TouchableOpacity
            onPress={onEdit}
            className={`p-2 rounded-full mr-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            <MaterialIcons
              name="edit"
              size={16}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            className={`p-2 rounded-full ${isDark ? 'bg-red-900' : 'bg-red-100'}`}
          >
            <MaterialIcons
              name="delete"
              size={16}
              color={isDark ? '#F87171' : '#EF4444'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
