import { useState, useEffect } from 'react';

import { CollectionImportExportManager } from '@/core/CollectionImportExportManager';
import { CollectionsManager } from '@/core/CollectionsManager';

// Version status types
type VersionStatus = 'new' | 'same' | 'upgrade' | 'downgrade';

export interface FileDisplayInfo {
  collectionName: string;
  ownerName: string;
  version: string;
  language: string;
  storyCount: number;
  exportDate: string;
}

export interface FileImportStatus {
  displayInfo: FileDisplayInfo | null;
  versionStatus: VersionStatus;
  localVersion?: string;
  loading: boolean;
  error: string | null;
}

export function useFileImport(importPath: string | null): FileImportStatus {
  const [status, setStatus] = useState<FileImportStatus>({
    displayInfo: null,
    versionStatus: 'new',
    localVersion: undefined,
    loading: false,
    error: null,
  });

  // Compare versions utility
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

  useEffect(() => {
    if (!importPath) {
      setStatus({
        displayInfo: null,
        versionStatus: 'new',
        localVersion: undefined,
        loading: false,
        error: null,
      });
      return;
    }

    const processFile = async () => {
      const decodedPath = decodeURIComponent(importPath);
      setStatus((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Get display info from the zip file
        const importManager = CollectionImportExportManager.getInstance();
        await importManager.initialize();

        const displayInfo = await importManager.getZipDisplayInfo(decodedPath);

        if (!displayInfo) {
          setStatus({
            displayInfo: null,
            versionStatus: 'new',
            localVersion: undefined,
            loading: false,
            error: 'Could not read file information',
          });
          return;
        }

        // Get local collections to check for version conflicts
        const collectionsManager = CollectionsManager.getInstance();
        await collectionsManager.initialize();
        const localCollections = await collectionsManager.getLocalCollections();

        // Try multiple strategies to find matching collection
        const possibleMatches = localCollections.filter((local) => {
          // Strategy 1: Exact display name match (case insensitive)
          const displayNameMatch =
            local.displayName.toLowerCase() === displayInfo.collectionName.toLowerCase();

          // Strategy 2: ID contains collection name
          const idContainsName = local.id
            .toLowerCase()
            .includes(displayInfo.collectionName.toLowerCase());

          // Strategy 3: Collection name contains display name
          const nameContainsId = displayInfo.collectionName
            .toLowerCase()
            .includes(local.displayName.toLowerCase());

          // Strategy 4: Check owner match
          const ownerMatch = local.id.toLowerCase().includes(displayInfo.ownerName.toLowerCase());

          return displayNameMatch || idContainsName || nameContainsId || ownerMatch;
        });

        // Find the best match (prioritize exact display name match)
        const matchingLocal =
          possibleMatches.length > 0
            ? possibleMatches.find(
                (local) =>
                  local.displayName.toLowerCase() === displayInfo.collectionName.toLowerCase()
              ) || possibleMatches[0]
            : null;

        let versionStatus: VersionStatus = 'new';
        let localVersion: string | undefined;

        if (matchingLocal) {
          localVersion = matchingLocal.version;
          const versionComparison = compareVersions(displayInfo.version, matchingLocal.version);

          if (versionComparison === 0) {
            versionStatus = 'same';
          } else if (versionComparison > 0) {
            versionStatus = 'upgrade';
          } else {
            versionStatus = 'downgrade';
          }
        }

        setStatus({
          displayInfo,
          versionStatus,
          localVersion,
          loading: false,
          error: null,
        });
      } catch (error) {
        setStatus({
          displayInfo: null,
          versionStatus: 'new',
          localVersion: undefined,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    };

    processFile();
  }, [importPath]);

  return status;
}
