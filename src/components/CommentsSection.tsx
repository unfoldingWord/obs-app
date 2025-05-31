import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, useColorScheme } from 'react-native';

import { AddCommentModal } from '../components/AddCommentModal';
import { CommentItem } from '../components/CommentItem';
import { CommentsManager, FrameComment } from '../core/CommentsManager';

interface NotesSectionProps {
  collectionId: string;
  storyNumber: number;
  frameNumber: number;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  collectionId,
  storyNumber,
  frameNumber,
  isVisible = false,
  onToggleVisibility,
}) => {
  const [notes, setNotes] = useState<FrameComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<FrameComment | null>(null);
  const [notesCount, setNotesCount] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.initialize();

      const frameNotes = await commentsManager.getFrameComments(
        collectionId,
        storyNumber,
        frameNumber
      );
      const count = await commentsManager.getCommentsCount(collectionId, storyNumber, frameNumber);

      setNotes(frameNotes);
      setNotesCount(count);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [collectionId, storyNumber, frameNumber]);

  const loadNotesCount = useCallback(async () => {
    try {
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.initialize();

      const count = await commentsManager.getCommentsCount(collectionId, storyNumber, frameNumber);

      setNotesCount(count);
    } catch (error) {
      console.error('Error loading notes count:', error);
      // Don't show alert for count loading errors, just log them
    }
  }, [collectionId, storyNumber, frameNumber]);

  useEffect(() => {
    if (isVisible) {
      loadNotes();
    }
  }, [isVisible, loadNotes]);

  // Load notes count when frame changes (even when not visible)
  useEffect(() => {
    loadNotesCount();
  }, [collectionId, storyNumber, frameNumber]);

  const handleAddNote = async (noteText: string) => {
    try {
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.addComment(collectionId, storyNumber, frameNumber, noteText);
      if (isVisible) {
        await loadNotes();
      } else {
        await loadNotesCount();
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note. Please try again.');
    }
  };

  const handleEditNote = async (noteId: string, newText: string) => {
    try {
      const commentsManager = CommentsManager.getInstance();
      await commentsManager.updateComment(noteId, newText);
      if (isVisible) {
        await loadNotes();
      } else {
        await loadNotesCount();
      }
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
      Alert.alert('Error', 'Failed to update note. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const commentsManager = CommentsManager.getInstance();
            await commentsManager.deleteComment(noteId);
            if (isVisible) {
              await loadNotes();
            } else {
              await loadNotesCount();
            }
          } catch (error) {
            console.error('Error deleting note:', error);
            Alert.alert('Error', 'Failed to delete note. Please try again.');
          }
        },
      },
    ]);
  };

  const handleEditPress = (note: FrameComment) => {
    setEditingNote(note);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
  };

  const renderNoteItem = ({ item }: { item: FrameComment }) => (
    <CommentItem
      comment={item}
      onEdit={() => handleEditPress(item)}
      onDelete={() => handleDeleteNote(item.id)}
      isDark={isDark}
    />
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center py-12">
      <MaterialIcons name="edit-note" size={64} color={isDark ? '#4B5563' : '#9CA3AF'} />
    </View>
  );

  return (
    <>
      {/* Notes Toggle Button */}
      <TouchableOpacity
        onPress={onToggleVisibility}
        className={`px-4 py-3 border-t ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialIcons name="edit-note" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          {notesCount > 0 && (
            <View
              className={`rounded-full px-2.5 py-1 ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
              <Text className="text-xs font-bold text-white">{notesCount}</Text>
            </View>
          )}
        </View>
        <MaterialIcons
          name={isVisible ? 'expand-less' : 'expand-more'}
          size={24}
          color={isDark ? '#9CA3AF' : '#6B7280'}
        />
      </TouchableOpacity>

      {/* Notes List */}
      {isVisible && (
        <View
          className={`${isDark ? 'bg-gray-950' : 'bg-gray-50'} border-t ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}>
          {/* Notes List */}
          <View style={{ maxHeight: 300 }}>
            <FlatList
              data={notes}
              renderItem={renderNoteItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Add Note Button */}
          <View className={`border-t p-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              className={`rounded-xl p-3 shadow-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MaterialIcons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add/Edit Note Modal */}
      <AddCommentModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onSubmit={
          editingNote
            ? (text: string) => handleEditNote(editingNote.id, text)
            : handleAddNote
        }
        initialText={editingNote?.comment || ''}
        title={editingNote ? 'Edit Note' : 'Add Note'}
        isDark={isDark}
      />
    </>
  );
};
