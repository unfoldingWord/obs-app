import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, useColorScheme } from 'react-native';

import { AddCommentModal } from '../components/AddCommentModal';
import { CommentItem } from '../components/CommentItem';
import { CommentsManager, FrameComment } from '../core/CommentsManager';

interface CommentsSectionProps {
  collectionId: string;
  storyNumber: number;
  frameNumber: number;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  collectionId,
  storyNumber,
  frameNumber,
  isVisible = false,
  onToggleVisibility,
}) => {
  const [comments, setComments] = useState<FrameComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingComment, setEditingComment] = useState<FrameComment | null>(null);
  const [commentsCount, setCommentsCount] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.initialize();

      const frameComments = await commentsManager.getFrameComments(
        collectionId,
        storyNumber,
        frameNumber
      );
      const count = await commentsManager.getCommentsCount(collectionId, storyNumber, frameNumber);

      setComments(frameComments);
      setCommentsCount(count);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [collectionId, storyNumber, frameNumber]);

  const loadCommentsCount = useCallback(async () => {
    try {
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.initialize();

      const count = await commentsManager.getCommentsCount(collectionId, storyNumber, frameNumber);

      setCommentsCount(count);
    } catch (error) {
      console.error('Error loading comments count:', error);
      // Don't show alert for count loading errors, just log them
    }
  }, [collectionId, storyNumber, frameNumber]);

  useEffect(() => {
    if (isVisible) {
      loadComments();
    }
  }, [isVisible, loadComments]);

  // Load comments count when frame changes (even when not visible)
  useEffect(() => {
    loadCommentsCount();
  }, [collectionId, storyNumber, frameNumber]);

  const handleAddComment = async (commentText: string) => {
    try {
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.addComment(collectionId, storyNumber, frameNumber, commentText);
      if (isVisible) {
        await loadComments();
      } else {
        await loadCommentsCount();
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  const handleEditComment = async (commentId: string, newText: string) => {
    try {
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.updateComment(commentId, newText);
      if (isVisible) {
        await loadComments();
      } else {
        await loadCommentsCount();
      }
      setEditingComment(null);
    } catch (error) {
      console.error('Error updating comment:', error);
      Alert.alert('Error', 'Failed to update comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const commentsManager = CommentsManager.getInstance();
            await commentsManager.deleteComment(commentId);
            if (isVisible) {
              await loadComments();
            } else {
              await loadCommentsCount();
            }
          } catch (error) {
            console.error('Error deleting comment:', error);
            Alert.alert('Error', 'Failed to delete comment. Please try again.');
          }
        },
      },
    ]);
  };

  const handleEditPress = (comment: FrameComment) => {
    setEditingComment(comment);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingComment(null);
  };

  const renderCommentItem = ({ item }: { item: FrameComment }) => (
    <CommentItem
      comment={item}
      onEdit={() => handleEditPress(item)}
      onDelete={() => handleDeleteComment(item.id)}
      isDark={isDark}
    />
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center py-8">
      <MaterialIcons name="comment" size={48} color={isDark ? '#6B7280' : '#9CA3AF'} />
      <Text className={`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        No comments yet
      </Text>
      <Text className={`mt-1 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        Be the first to add a comment!
      </Text>
    </View>
  );

  return (
    <>
      {/* Comments Toggle Button */}
      <TouchableOpacity
        onPress={onToggleVisibility}
        className={`flex-row items-center justify-between p-3 ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        } border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <View className="flex-row items-center">
          <MaterialIcons name="comment" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text className={`ml-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Comments
          </Text>
          {commentsCount > 0 && (
            <View
              className={`ml-2 rounded-full px-2 py-1 ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
              <Text className="text-xs font-bold text-white">{commentsCount}</Text>
            </View>
          )}
        </View>
        <MaterialIcons
          name={isVisible ? 'expand-less' : 'expand-more'}
          size={24}
          color={isDark ? '#9CA3AF' : '#6B7280'}
        />
      </TouchableOpacity>

      {/* Comments List */}
      {isVisible && (
        <View
          className={`${isDark ? 'bg-gray-900' : 'bg-white'} border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
          {/* Add Comment Button */}
          <View className="border-b border-gray-200 p-3 dark:border-gray-700">
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              className={`flex-row items-center justify-center rounded-lg p-3 ${
                isDark ? 'bg-blue-600' : 'bg-blue-500'
              }`}>
              <MaterialIcons name="add" size={20} color="white" />
              <Text className="ml-2 font-medium text-white">Add Comment</Text>
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <View style={{ maxHeight: 300 }}>
            <FlatList
              data={comments}
              renderItem={renderCommentItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      )}

      {/* Add/Edit Comment Modal */}
      <AddCommentModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onSubmit={
          editingComment
            ? (text: string) => handleEditComment(editingComment.id, text)
            : handleAddComment
        }
        initialText={editingComment?.comment || ''}
        title={editingComment ? 'Edit Comment' : 'Add Comment'}
        isDark={isDark}
      />
    </>
  );
};
