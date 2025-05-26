import { useState, useEffect } from 'react';

import { Collection, CollectionsManager } from '../core/CollectionsManager';

export function useCollections() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const collectionsManager = CollectionsManager.getInstance();
      await collectionsManager.initialize();
      const downloadedCollections = await collectionsManager.getLocalCollections();
      setCollections(downloadedCollections);
      console.log('Loaded downloaded collections:', downloadedCollections.length);
    } catch (err) {
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    collections,
    refreshCollections: loadCollections,
  };
}
