import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Modal,
} from 'react-native';

import { IconModal } from './IconModal';
import { VersionComparison, CollectionInfo } from './VersionComparison';
import { CollectionImportExportManager } from '../core/CollectionImportExportManager';

export interface FileImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: (collectionName: string) => void;
  filePath: string;
  displayInfo: {
    collectionName: string;
    ownerName: string;
    version: string;
    language: string;
    storyCount: number;
    exportDate: string;
  } | null;
  isProcessingFile?: boolean;
  versionStatus?: VersionStatus;
  localVersion?: string;
}

// Version status types
type VersionStatus = 'new' | 'same' | 'upgrade' | 'downgrade';

// Using shared VersionComparison and CollectionInfo components

// Confirmation Modal Component - update to use shared VersionComparison
const ConfirmationModal: React.FC<{
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
  collection?: {
    displayInfo: {
      collectionName: string;
      ownerName: string;
      version: string;
    };
    versionStatus: VersionStatus;
    localVersion?: string;
  };
  importing?: boolean;
}> = ({ visible, onConfirm, onCancel, isDark, collection, importing = false }) => {
  const isUpgrade = collection?.versionStatus === 'upgrade';
  const isDowngrade = collection?.versionStatus === 'downgrade';

  return (
    <IconModal
      visible={visible}
      onClose={onCancel}
      isDark={isDark}
      icon={isUpgrade ? 'upgrade' : isDowngrade ? 'warning' : 'help'}
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
          icon: importing ? '' : 'check',
          color: isDark ? '#60A5FA' : '#3B82F6',
          onPress: onConfirm,
          renderContent: importing
            ? (isDark: boolean) => (
                <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
              )
            : undefined,
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

export default function FileImportModal({
  visible,
  onClose,
  onImportSuccess,
  filePath,
  displayInfo,
  isProcessingFile = false,
  versionStatus,
  localVersion,
}: FileImportModalProps) {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Reset state when modal becomes visible or file changes
  useEffect(() => {
    if (visible && displayInfo) {
      setImporting(false);
      setImportError(null);
    }
  }, [visible, displayInfo?.collectionName, displayInfo?.version, filePath]);

  const handleImport = async (overwrite: boolean = false) => {
    if (!displayInfo) return;

    try {
      setImporting(true);
      setImportError(null);

      const manager = CollectionImportExportManager.getInstance();
      await manager.initialize();

      const result = await manager.importCollectionOptimized(filePath, {
        overwriteExisting: overwrite,
        skipVersionCheck: false,
      });

      if (result.success) {
        setImporting(false);
        onImportSuccess(displayInfo.collectionName);
        onClose();
      } else {
        setImportError('Import failed due to an unknown error.');
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setImporting(false);
    }
  };

  // Only show modal if visible
  if (!visible) {
    return null;
  }

  // Show loading state while processing file or waiting for version status - FIRST PRIORITY
  if (isProcessingFile || (!displayInfo && !isProcessingFile)) {
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
            style={{ elevation: 20, zIndex: 10000, minWidth: 160, minHeight: 120 }}>
            {/* Header with loading spinner */}
            <View className="items-center p-3">
              <View className={`rounded-full p-3 ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/10'}`}>
                <ActivityIndicator size={24} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
            </View>

            {/* Close button */}
            <View
              className="flex-row border-t"
              style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
              <TouchableOpacity
                onPress={onClose}
                className={`flex-1 items-center justify-center py-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <MaterialIcons name="close" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Invalid file modal - only after we're done processing and still no displayInfo
  if (!displayInfo) {
    return (
      <IconModal
        visible={visible}
        onClose={onClose}
        isDark={isDark}
        icon="error"
        iconColor={isDark ? '#EF4444' : '#DC2626'}
        iconBgColor={isDark ? 'bg-red-600/20' : 'bg-red-500/10'}
        iconBorderColor={isDark ? 'border-red-600/30' : 'border-red-500/20'}
        title="Invalid File"
        message="This file does not appear to be a valid OBS collection."
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
  }

  // Import error modal
  if (importError) {
    return (
      <IconModal
        visible={visible}
        onClose={onClose}
        isDark={isDark}
        icon="error"
        iconColor={isDark ? '#EF4444' : '#DC2626'}
        iconBgColor={isDark ? 'bg-red-600/20' : 'bg-red-500/10'}
        iconBorderColor={isDark ? 'border-red-600/30' : 'border-red-500/20'}
        title="Import Failed"
        message={importError}
        buttons={[
          {
            icon: 'close',
            color: isDark ? '#9CA3AF' : '#6B7280',
            backgroundColor: isDark ? 'bg-gray-700' : 'bg-gray-50',
            onPress: onClose,
          },
          {
            icon: 'refresh',
            color: isDark ? '#60A5FA' : '#3B82F6',
            onPress: () => {
              setImportError(null);
              handleImport(false);
            },
          },
        ]}
      />
    );
  }

  // Wait for version status to be determined (after displayInfo is available)
  if (!versionStatus) {
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
            style={{ elevation: 20, zIndex: 10000, minWidth: 160, minHeight: 120 }}>
            {/* Header with loading spinner */}
            <View className="items-center p-3">
              <View className={`rounded-full p-3 ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/10'}`}>
                <ActivityIndicator size={24} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
            </View>

            {/* Close button */}
            <View
              className="flex-row border-t"
              style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
              <TouchableOpacity
                onPress={onClose}
                className={`flex-1 items-center justify-center py-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <MaterialIcons name="close" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Same version modal
  if (versionStatus === 'same') {
    return (
      <IconModal
        visible={visible}
        onClose={onClose}
        isDark={isDark}
        icon="check-circle"
        iconColor={isDark ? '#10B981' : '#059669'}
        iconBgColor={isDark ? 'bg-emerald-600/20' : 'bg-emerald-500/10'}
        iconBorderColor={isDark ? 'border-emerald-600/30' : 'border-emerald-500/20'}
        buttons={[
          {
            icon: 'close',
            color: isDark ? '#9CA3AF' : '#6B7280',
            backgroundColor: isDark ? 'bg-gray-700' : 'bg-gray-50',
            onPress: onClose,
          },
        ]}>
        <CollectionInfo
          collectionName={displayInfo.collectionName}
          ownerName={displayInfo.ownerName}
          version={displayInfo.version}
          versionStatus={versionStatus}
          isDark={isDark}
        />
      </IconModal>
    );
  }

  // Show confirmation modal immediately for upgrade/downgrade cases
  if (versionStatus === 'upgrade' || versionStatus === 'downgrade') {
    return (
      <ConfirmationModal
        visible={visible}
        onConfirm={() => handleImport(true)}
        onCancel={onClose}
        isDark={isDark}
        collection={{ displayInfo, versionStatus, localVersion }}
        importing={importing}
      />
    );
  }

  // New collection modal
  return (
    <IconModal
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      icon="library-books"
      iconColor={isDark ? '#7DD3FC' : '#0EA5E9'}
      iconBgColor={isDark ? 'bg-sky-900/15' : 'bg-sky-50/70'}
      iconBorderColor={isDark ? 'border-sky-600/30' : 'border-sky-500/20'}
      buttons={[
        {
          icon: 'close',
          color: isDark ? '#9CA3AF' : '#6B7280',
          backgroundColor: isDark ? 'bg-gray-700' : 'bg-gray-50',
          onPress: onClose,
        },
        {
          icon: importing ? '' : 'download',
          color: isDark ? '#60A5FA' : '#3B82F6',
          onPress: () => handleImport(false),
          renderContent: importing
            ? (isDark: boolean) => (
                <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
              )
            : undefined,
        },
      ]}>
      <CollectionInfo
        collectionName={displayInfo.collectionName}
        ownerName={displayInfo.ownerName}
        version={displayInfo.version}
        versionStatus={versionStatus}
        isDark={isDark}
      />
    </IconModal>
  );
}
