import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Modal,
  Animated,
} from 'react-native';

import { IconModal } from './IconModal';
import { VersionComparison } from './VersionComparison';
import { CollectionImportExportManager } from '../core/CollectionImportExportManager';
import { CollectionsManager } from '../core/CollectionsManager';
import {
  scanForImportableCollections,
  ImportableCollection,
  formatDate,
} from '../utils/importHelpers';

export interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

// Version comparison result
type VersionStatus = 'new' | 'same' | 'upgrade' | 'downgrade';

// Enhanced ImportableCollection with import status and version info
interface ImportableCollectionWithStatus extends ImportableCollection {
  versionStatus: VersionStatus;
  localVersion?: string; // The version that's currently installed locally
}

// Specific Modal Components using the reusable IconModal
const SuccessModal: React.FC<{ visible: boolean; onClose: () => void; isDark: boolean }> = ({
  visible,
  onClose,
  isDark,
}) => (
  <IconModal
    visible={visible}
    onClose={onClose}
    isDark={isDark}
    icon="check-circle"
    iconColor={isDark ? '#10B981' : '#059669'}
    iconBgColor={isDark ? 'bg-green-600/20' : 'bg-green-500/10'}
    iconBorderColor={isDark ? 'border-green-600/30' : 'border-green-500/20'}
    buttons={[
      {
        icon: 'close',
        color: isDark ? '#9CA3AF' : '#6B7280',
        backgroundColor: isDark ? 'bg-gray-700' : 'bg-gray-50',
        onPress: onClose,
      },
    ]}
  />
);

const ErrorModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
  isDark: boolean;
}> = ({ visible, onClose, onRetry, isDark }) => (
  <IconModal
    visible={visible}
    onClose={onClose}
    isDark={isDark}
    icon="error"
    iconColor={isDark ? '#EF4444' : '#DC2626'}
    iconBgColor={isDark ? 'bg-red-600/20' : 'bg-red-500/10'}
    iconBorderColor={isDark ? 'border-red-600/30' : 'border-red-500/20'}
    buttons={
      onRetry
        ? [
            {
              icon: 'close',
              color: isDark ? '#9CA3AF' : '#6B7280',
              backgroundColor: isDark ? 'bg-gray-700' : 'bg-gray-50',
              onPress: onClose,
            },
            {
              icon: 'refresh',
              color: isDark ? '#60A5FA' : '#3B82F6',
              onPress: onRetry,
            },
          ]
        : [
            {
              icon: 'close',
              color: isDark ? '#9CA3AF' : '#6B7280',
              backgroundColor: isDark ? 'bg-gray-700' : 'bg-gray-50',
              onPress: onClose,
            },
          ]
    }
  />
);

const InfoModal: React.FC<{ visible: boolean; onClose: () => void; isDark: boolean }> = ({
  visible,
  onClose,
  isDark,
}) => (
  <IconModal
    visible={visible}
    onClose={onClose}
    isDark={isDark}
    icon="info"
    iconColor={isDark ? '#60A5FA' : '#3B82F6'}
    iconBgColor={isDark ? 'bg-blue-600/20' : 'bg-blue-500/10'}
    iconBorderColor={isDark ? 'border-blue-600/30' : 'border-blue-500/20'}
    buttons={[
      {
        icon: 'close',
        color: isDark ? '#9CA3AF' : '#6B7280',
        backgroundColor: isDark ? 'bg-gray-700' : 'bg-gray-50',
        onPress: onClose,
      },
    ]}
  />
);

const ConfirmationModal: React.FC<{
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
  collection?: ImportableCollectionWithStatus;
}> = ({ visible, onConfirm, onCancel, isDark, collection }) => {
  const isUpgrade = collection?.versionStatus === 'upgrade';
  const isDowngrade = collection?.versionStatus === 'downgrade';

  return (
    <IconModal
      visible={visible}
      onClose={onCancel}
      isDark={isDark}
      icon={isUpgrade ? 'trending-up' : isDowngrade ? 'warning' : 'help'}
      iconColor={
        isUpgrade
          ? isDark
            ? '#10B981'
            : '#059669'
          : isDowngrade
            ? isDark
              ? '#FCD34D'
              : '#F59E0B'
            : isDark
              ? '#60A5FA'
              : '#3B82F6'
      }
      iconBgColor={
        isUpgrade
          ? isDark
            ? 'bg-green-600/20'
            : 'bg-green-500/10'
          : isDowngrade
            ? isDark
              ? 'bg-amber-600/20'
              : 'bg-amber-500/10'
            : isDark
              ? 'bg-blue-600/20'
              : 'bg-blue-500/10'
      }
      iconBorderColor={
        isUpgrade
          ? isDark
            ? 'border-green-600/30'
            : 'border-green-500/20'
          : isDowngrade
            ? isDark
              ? 'border-amber-600/30'
              : 'border-amber-500/20'
            : isDark
              ? 'border-blue-600/30'
              : 'border-blue-500/20'
      }
      buttons={[
        {
          icon: 'close',
          color: isDark ? '#9CA3AF' : '#6B7280',
          backgroundColor: isDark ? 'bg-gray-700' : 'bg-gray-50',
          onPress: onCancel,
        },
        {
          icon: 'check',
          color: isDark ? '#60A5FA' : '#3B82F6',
          onPress: onConfirm,
        },
      ]}>
      {collection &&
        (collection.versionStatus === 'upgrade' || collection.versionStatus === 'downgrade') && (
          <VersionComparison
            collectionName={collection.displayInfo.collectionName}
            ownerName={collection.displayInfo.ownerName}
            currentVersion={collection.localVersion || '?'}
            newVersion={collection.displayInfo.version}
            versionStatus={collection.versionStatus}
            isDark={isDark}
          />
        )}
    </IconModal>
  );
};

export default function ImportModal({ visible, onClose, onImportSuccess }: ImportModalProps) {
  const [importingCollectionPath, setImportingCollectionPath] = useState<string | null>(null);
  const [importableCollections, setImportableCollections] = useState<
    ImportableCollectionWithStatus[]
  >([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [addingDirectory, setAddingDirectory] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showDeleteSingleConfirm, setShowDeleteSingleConfirm] = useState(false);
  const [collectionToDelete, setCollectionToDelete] =
    useState<ImportableCollectionWithStatus | null>(null);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [confirmationCollection, setConfirmationCollection] = useState<
    ImportableCollectionWithStatus | undefined
  >(undefined);

  // Shake animation for already imported collections
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [shakingCollectionPath, setShakingCollectionPath] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Shake animation function
  const triggerShakeAnimation = (collectionPath: string) => {
    setShakingCollectionPath(collectionPath);

    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShakingCollectionPath(null);
    });
  };

  // Version comparison utility
  const compareVersions = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  };

  // Get visual properties based on version status - Soft Pastels
  const getVersionStatusStyle = (status: VersionStatus) => {
    switch (status) {
      case 'new':
        return {
          dotColor: isDark ? '#7DD3FC' : '#0EA5E9',
          bgColor: isDark ? 'bg-sky-900/15' : 'bg-sky-50/70',
          iconColor: isDark ? '#7DD3FC' : '#0284C7',
          iconName: 'library-books',
          actionBgColor: isDark ? 'bg-sky-800/15' : 'bg-sky-100/50',
          actionIconColor: isDark ? '#7DD3FC' : '#0284C7',
          actionIconName: 'arrow-forward',
        };
      case 'same':
        return {
          dotColor: isDark ? '#86EFAC' : '#10B981',
          bgColor: isDark ? 'bg-emerald-900/15' : 'bg-emerald-50/70',
          iconColor: isDark ? '#86EFAC' : '#059669',
          iconName: 'check-circle',
          actionBgColor: isDark ? 'bg-emerald-800/15' : 'bg-emerald-100/50',
          actionIconColor: isDark ? '#86EFAC' : '#059669',
          actionIconName: 'done',
        };
      case 'upgrade':
        return {
          dotColor: isDark ? '#7DD3FC' : '#0EA5E9',
          bgColor: isDark ? 'bg-sky-900/15' : 'bg-sky-50/70',
          iconColor: isDark ? '#7DD3FC' : '#0284C7',
          iconName: 'trending-up',
          actionBgColor: isDark ? 'bg-sky-800/15' : 'bg-sky-100/50',
          actionIconColor: isDark ? '#7DD3FC' : '#0284C7',
          actionIconName: 'north',
        };
      case 'downgrade':
        return {
          dotColor: isDark ? '#FDA4AF' : '#F43F5E',
          bgColor: isDark ? 'bg-rose-900/15' : 'bg-rose-50/70',
          iconColor: isDark ? '#FDA4AF' : '#F43F5E',
          iconName: 'trending-down',
          actionBgColor: isDark ? 'bg-rose-800/15' : 'bg-rose-100/50',
          actionIconColor: isDark ? '#FDA4AF' : '#F43F5E',
          actionIconName: 'south',
        };
    }
  };

  // Load collections when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadImportableCollections();
    }
  }, [visible]);

  const loadImportableCollections = async () => {
    try {
      setLoadingCollections(true);
      const collections = await scanForImportableCollections();

      // Get local collections to check for duplicates
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.initialize();
      const localCollections = await collectionsManager.getLocalCollections();

      // Add version status to each collection
      const collectionsWithStatus: ImportableCollectionWithStatus[] = collections.map(
        (collection) => {
          // Try different possible ID formats to match against local collections
          const possibleIds = [
            collection.displayInfo.collectionName,
            `${collection.displayInfo.ownerName}/${collection.displayInfo.collectionName}`,
            collection.fileName.replace('.zip', ''), // Use filename without extension
          ];

          // Find matching local collection
          const matchingLocal = localCollections.find(
            (local) =>
              possibleIds.some((id) => local.id === id) ||
              local.displayName.toLowerCase() ===
                collection.displayInfo.collectionName.toLowerCase()
          );

          // Determine version status
          let versionStatus: VersionStatus = 'new';
          let localVersion: string | undefined;

          if (matchingLocal) {
            localVersion = matchingLocal.version;
            const versionComparison = compareVersions(
              collection.displayInfo.version,
              matchingLocal.version
            );

            if (versionComparison === 0) {
              versionStatus = 'same';
            } else if (versionComparison > 0) {
              versionStatus = 'upgrade';
            } else {
              versionStatus = 'downgrade';
            }
          }

          return {
            ...collection,
            versionStatus,
            localVersion,
          };
        }
      );

      setImportableCollections(collectionsWithStatus);
    } catch (error) {
      console.error('Error loading importable collections:', error);
      setShowErrorModal(true);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleDirectoryPicker = async () => {
    try {
      setAddingDirectory(true);
      const { StorageAccessFramework } = await import('expo-file-system');

      // Request directory permissions from user
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        // Store the directory URI for scanning
        await AsyncStorage.setItem('@custom_import_directory', permissions.directoryUri);

        // Refresh collections list to include the new directory
        await loadImportableCollections();
      }
    } catch (error) {
      console.error('Error adding directory:', error);
      setShowErrorModal(true);
    } finally {
      setAddingDirectory(false);
    }
  };

  const handleCollectionSelect = async (collection: ImportableCollectionWithStatus) => {
    if (collection.versionStatus === 'same') {
      // Trigger shake animation for already imported collections
      triggerShakeAnimation(collection.filePath);
      return;
    } else if (collection.versionStatus === 'downgrade' || collection.versionStatus === 'upgrade') {
      setConfirmationCollection(collection);
      setPendingAction(
        () => () => importCollectionFile(collection.filePath, collection.fileName, true)
      ); // Allow overwriting
      setShowConfirmationModal(true);
      return;
    }

    // New collection - import directly
    await importCollectionFile(collection.filePath, collection.fileName, false); // Don't overwrite for new collections
  };

  const importCollectionFile = async (
    filePath: string,
    fileName: string,
    allowOverwrite: boolean = false
  ) => {
    try {
      setImportingCollectionPath(filePath);
      const manager = CollectionImportExportManager.getInstance();
      await manager.initialize();

      const importResult = await manager.importCollectionOptimized(
        filePath,
        {
          overwriteExisting: allowOverwrite,
          skipVersionCheck: false,
        },
        (progress, status) => {
          // Progress callback - can be used for UI updates if needed
        }
      );

      if (importResult.success) {
        onClose();
        onImportSuccess();
      } else {
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error importing collection:', error);
      setShowErrorModal(true);
    } finally {
      setImportingCollectionPath(null);
    }
  };

  const handleRefresh = () => {
    loadImportableCollections();
  };

  const handleDeleteCollection = async (collection: ImportableCollectionWithStatus) => {
    setCollectionToDelete(collection);
    setShowDeleteSingleConfirm(true);
  };

  const deleteCollectionFile = async (filePath: string, fileName: string) => {
    try {
      setDeletingCollection(filePath);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
        // Refresh the collections list
        await loadImportableCollections();
      } else {
        // Still refresh the list in case it was already deleted
        await loadImportableCollections();
        setShowInfoModal(true);
      }
    } catch (error) {
      console.error('Error deleting collection file:', error);
      setShowErrorModal(true);
    } finally {
      setDeletingCollection(null);
    }
  };

  const confirmDeleteSingle = async () => {
    if (collectionToDelete) {
      setShowDeleteSingleConfirm(false);
      await deleteCollectionFile(collectionToDelete.filePath, collectionToDelete.fileName);
      setCollectionToDelete(null);
    }
  };

  const cancelDeleteSingle = () => {
    setShowDeleteSingleConfirm(false);
    setCollectionToDelete(null);
  };

  const handleDeleteAll = () => {
    if (importableCollections.length === 0) {
      setShowInfoModal(true);
      return;
    }

    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAll = async () => {
    try {
      setShowDeleteAllConfirm(false);
      setLoadingCollections(true);

      let errorCount = 0;

      // Delete all collection files
      for (const collection of importableCollections) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(collection.filePath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(collection.filePath);
          }
        } catch (error) {
          console.error('Error during bulk delete:', error);
          errorCount++;
        }
      }

      // Refresh the collections list
      await loadImportableCollections();

      // Show result only if there were errors
      if (errorCount > 0) {
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error during bulk delete:', error);
      setShowErrorModal(true);
    } finally {
      setLoadingCollections(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <View className={`mt-20 flex-1 rounded-t-3xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          {/* Header */}
          <View className={`border-b px-6 py-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <View className="flex-row items-center justify-between">
              <View className={`rounded-full p-3 ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/10'}`}>
                <MaterialIcons
                  name="upload-file"
                  size={28}
                  color={isDark ? '#60A5FA' : '#3B82F6'}
                />
              </View>
              <View className="flex-row gap-2 space-x-2">
                {importableCollections.length > 0 && (
                  <TouchableOpacity
                    onPress={handleDeleteAll}
                    disabled={
                      !!importingCollectionPath ||
                      !!deletingCollection ||
                      addingDirectory ||
                      loadingCollections
                    }
                    className={`rounded-full p-2 ${isDark ? 'bg-gray-600/20' : 'bg-gray-500/10'} ${!!importingCollectionPath || !!deletingCollection || addingDirectory || loadingCollections ? 'opacity-50' : ''}`}>
                    <MaterialIcons
                      name="delete-sweep"
                      size={24}
                      color={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={onClose}
                  className={`rounded-full p-2 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <MaterialIcons name="close" size={24} color={isDark ? '#FFFFFF' : '#374151'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Action Bar */}
          <View className="px-6 py-3">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={handleRefresh}
                disabled={!!importingCollectionPath || addingDirectory || loadingCollections}
                className={`rounded-lg p-3 ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/10'} ${!!importingCollectionPath || addingDirectory || loadingCollections ? 'opacity-50' : ''}`}>
                <MaterialIcons name="refresh" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDirectoryPicker}
                disabled={!!importingCollectionPath || addingDirectory}
                className={`rounded-lg p-3 ${isDark ? 'bg-gray-600/20' : 'bg-gray-500/10'} ${!!importingCollectionPath || addingDirectory ? 'opacity-50' : ''}`}>
                {addingDirectory ? (
                  <ActivityIndicator size="small" color={isDark ? '#9CA3AF' : '#6B7280'} />
                ) : (
                  <MaterialIcons
                    name="folder-open"
                    size={20}
                    color={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Collections List */}
          <View className="flex-1">
            {loadingCollections ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
                <MaterialIcons
                  name="auto-awesome"
                  size={32}
                  color={isDark ? '#4B5563' : '#9CA3AF'}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : importableCollections.length === 0 ? (
              <View className="flex-1 items-center justify-center p-6">
                <MaterialIcons name="search-off" size={64} color={isDark ? '#4B5563' : '#9CA3AF'} />
                <MaterialIcons
                  name="folder-open"
                  size={24}
                  color={isDark ? '#6B7280' : '#9CA3AF'}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              <FlatList
                data={importableCollections}
                renderItem={({ item }) => {
                  const isShaking = shakingCollectionPath === item.filePath;
                  const shakeTransform = isShaking ? [{ translateX: shakeAnimation }] : [];

                  return (
                    <Animated.View
                      style={{
                        transform: shakeTransform,
                        elevation: 8,
                      }}>
                      <TouchableOpacity
                        onPress={() => handleCollectionSelect(item)}
                        onLongPress={() => handleDeleteCollection(item)}
                        disabled={
                          !!importingCollectionPath || !!deletingCollection || addingDirectory
                        }
                        className={`mx-3 mb-4 overflow-hidden rounded-2xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} ${!!importingCollectionPath || !!deletingCollection || addingDirectory ? 'opacity-50' : ''}`}>
                        <View className="p-5">
                          <View className="flex-row items-start justify-between">
                            <View className="mr-4 flex-1 flex-row items-start">
                              {/* Collection Icon */}
                              <View
                                className={`mr-3 rounded-full p-3 ${getVersionStatusStyle(item.versionStatus).bgColor}`}>
                                <MaterialIcons
                                  name={getVersionStatusStyle(item.versionStatus).iconName as any}
                                  size={24}
                                  color={getVersionStatusStyle(item.versionStatus).iconColor}
                                />
                              </View>

                              {/* Collection Info */}
                              <View className="min-w-0 flex-1">
                                <Text
                                  className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {item.displayInfo.collectionName}
                                </Text>
                                <View className="mt-1 flex-row items-center">
                                  <MaterialIcons
                                    name="person"
                                    size={14}
                                    color={isDark ? '#9CA3AF' : '#6B7280'}
                                  />
                                  <Text
                                    className={`ml-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {item.displayInfo.ownerName}
                                  </Text>
                                  <MaterialIcons
                                    name="bookmark"
                                    size={14}
                                    color={isDark ? '#9CA3AF' : '#6B7280'}
                                    style={{ marginLeft: 12 }}
                                  />
                                  <Text
                                    className={`ml-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {item.displayInfo.version}
                                  </Text>
                                </View>
                                <View className="mt-1 flex-row items-center">
                                  <MaterialIcons
                                    name="menu-book"
                                    size={14}
                                    color={isDark ? '#9CA3AF' : '#6B7280'}
                                  />
                                  <Text
                                    className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {item.displayInfo.storyCount}
                                  </Text>
                                  <MaterialIcons
                                    name="schedule"
                                    size={14}
                                    color={isDark ? '#9CA3AF' : '#6B7280'}
                                    style={{ marginLeft: 12 }}
                                  />
                                  <Text
                                    className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {formatDate(item.displayInfo.exportDate)}
                                  </Text>
                                </View>
                                <View className="mt-1 flex-row items-center">
                                  <MaterialIcons
                                    name={item.storageLocation.icon as any}
                                    size={16}
                                    color={isDark ? '#9CA3AF' : '#6B7280'}
                                  />
                                </View>
                              </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row items-start" style={{ gap: 8 }}>
                              {/* Delete Button */}
                              <TouchableOpacity
                                onPress={() => handleDeleteCollection(item)}
                                disabled={
                                  !!importingCollectionPath ||
                                  !!deletingCollection ||
                                  addingDirectory
                                }
                                className={`rounded-full p-2 ${isDark ? 'bg-gray-600/20' : 'bg-gray-500/10'} ${!!importingCollectionPath || !!deletingCollection || addingDirectory ? 'opacity-50' : ''}`}>
                                {deletingCollection === item.filePath ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={isDark ? '#9CA3AF' : '#6B7280'}
                                  />
                                ) : (
                                  <MaterialIcons
                                    name="delete"
                                    size={18}
                                    color={isDark ? '#9CA3AF' : '#6B7280'}
                                  />
                                )}
                              </TouchableOpacity>

                              {/* Import Arrow / Status */}
                              <View
                                className={`rounded-full p-2 ${getVersionStatusStyle(item.versionStatus).actionBgColor}`}>
                                {importingCollectionPath === item.filePath ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={
                                      getVersionStatusStyle(item.versionStatus).actionIconColor
                                    }
                                  />
                                ) : (
                                  <MaterialIcons
                                    name={
                                      getVersionStatusStyle(item.versionStatus)
                                        .actionIconName as any
                                    }
                                    size={20}
                                    color={
                                      getVersionStatusStyle(item.versionStatus).actionIconColor
                                    }
                                  />
                                )}
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                }}
                keyExtractor={(item) => item.filePath}
                contentContainerStyle={{ paddingVertical: 16 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>

        {/* Delete All Confirmation Modal */}
        <IconModal
          visible={showDeleteAllConfirm}
          onClose={() => setShowDeleteAllConfirm(false)}
          isDark={isDark}
          icon="warning"
          iconColor={isDark ? '#F87171' : '#EF4444'}
          iconBgColor={isDark ? 'bg-red-600/20' : 'bg-red-500/10'}
          iconBorderColor={isDark ? 'border-red-600/30' : 'border-red-500/20'}
          buttons={[
            {
              icon: 'close',
              color: isDark ? '#9CA3AF' : '#6B7280',
              onPress: () => {
                setShowDeleteAllConfirm(false);
                setPendingAction(null);
              },
            },
            {
              icon: 'delete',
              color: isDark ? '#F87171' : '#EF4444',
              onPress: () => {
                setShowDeleteAllConfirm(false);
                if (pendingAction) {
                  pendingAction();
                  setPendingAction(null);
                } else {
                  confirmDeleteAll();
                }
              },
              renderContent: (isDark: boolean) => (
                <View className="flex-row items-center">
                  <MaterialIcons name="delete" size={24} color={isDark ? '#F87171' : '#EF4444'} />
                  {/* Count Badge - only show if more than 1 item */}
                  {importableCollections.length > 1 && (
                    <View
                      className={`ml-2 h-6 min-w-6 items-center justify-center rounded-full ${isDark ? 'bg-red-600' : 'bg-red-500'} border-2 ${isDark ? 'border-gray-800' : 'border-white'}`}>
                      <Text className="text-xs font-medium text-white">
                        {importableCollections.length}
                      </Text>
                    </View>
                  )}
                </View>
              ),
            },
          ]}>
          {/* Scrollable Collections List */}
          {importableCollections.length > 0 && (
            <View
              className={`max-h-32 w-full rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <FlatList
                data={importableCollections}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View className="border-b border-gray-200/10 p-3">
                    <Text
                      className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                      numberOfLines={1}>
                      {item.displayInfo.collectionName}
                    </Text>
                    <View className="mt-1 flex-row items-center">
                      <Text
                        className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                        numberOfLines={1}>
                        {item.displayInfo.ownerName}
                      </Text>
                      <View
                        className={`mx-2 h-1 w-1 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`}
                      />
                      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.displayInfo.version}
                      </Text>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.filePath}
              />
            </View>
          )}
        </IconModal>

        {/* Delete Single Collection Confirmation Modal */}
        <IconModal
          visible={showDeleteSingleConfirm}
          onClose={cancelDeleteSingle}
          isDark={isDark}
          icon="warning"
          iconColor={isDark ? '#F87171' : '#EF4444'}
          iconBgColor={isDark ? 'bg-red-600/20' : 'bg-red-500/10'}
          iconBorderColor={isDark ? 'border-red-600/30' : 'border-red-500/20'}
          title={collectionToDelete?.displayInfo.collectionName}
          buttons={[
            {
              icon: 'close',
              color: isDark ? '#9CA3AF' : '#6B7280',
              onPress: cancelDeleteSingle,
            },
            {
              icon: 'delete',
              color: isDark ? '#F87171' : '#EF4444',
              onPress: confirmDeleteSingle,
            },
          ]}>
          {/* Collection Details */}
          {collectionToDelete && (
            <View className="mt-2 max-w-64">
              <View className="flex-row items-center justify-center">
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {collectionToDelete.displayInfo.ownerName}
                </Text>
                <View
                  className={`mx-2 h-1 w-1 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`}
                />
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {collectionToDelete.displayInfo.version}
                </Text>
              </View>
            </View>
          )}
        </IconModal>

        {/* Success Modal */}
        <SuccessModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          isDark={isDark}
        />

        {/* Error Modal */}
        <ErrorModal
          visible={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          onRetry={() => {
            setShowErrorModal(false);
            loadImportableCollections();
          }}
          isDark={isDark}
        />

        {/* Info Modal */}
        <InfoModal
          visible={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          isDark={isDark}
        />

        {/* Confirmation Modal */}
        <ConfirmationModal
          visible={showConfirmationModal}
          onConfirm={() => {
            setShowConfirmationModal(false);
            if (pendingAction) {
              pendingAction();
              setPendingAction(null);
            }
            setConfirmationCollection(undefined);
          }}
          onCancel={() => {
            setShowConfirmationModal(false);
            setPendingAction(null);
            setConfirmationCollection(undefined);
          }}
          isDark={isDark}
          collection={confirmationCollection}
        />
      </View>
    </Modal>
  );
}
