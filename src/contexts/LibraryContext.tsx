import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import RNFS from 'react-native-fs';
import type { PlayInfo } from '../../types/video';

export type LibraryType = 'history' | 'downloads' | 'liked' | 'saved';
export type LibraryItem = PlayInfo & { updatedAt: number; downloadStatus?: 'downloading' | 'downloaded' };

type LibraryContextValue = {
  items: Record<LibraryType, LibraryItem[]>;
  recordHistory: (video: PlayInfo) => void;
  toggleItem: (type: 'liked' | 'saved', video: PlayInfo) => void;
  addDownload: (video: PlayInfo) => void;
  startDownload: (video: PlayInfo) => void;
  downloadStatus: (video: PlayInfo | null) => 'idle' | 'downloading' | 'downloaded';
  hasItem: (type: 'liked' | 'saved', video: PlayInfo | null) => boolean;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);
const emptyItems: Record<LibraryType, LibraryItem[]> = { history: [], downloads: [], liked: [], saved: [] };
const libraryFilePath = `${RNFS.DocumentDirectoryPath}/streamr-library.json`;

const upsert = (list: LibraryItem[], video: PlayInfo) => [
  { ...video, updatedAt: Date.now() },
  ...list.filter(item => item.stream_url !== video.stream_url),
].slice(0, 50);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState(emptyItems);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const saved = await RNFS.readFile(libraryFilePath, 'utf8');
        const parsed = JSON.parse(saved);
        setItems({
          history: Array.isArray(parsed.history) ? parsed.history : [],
          downloads: Array.isArray(parsed.downloads) ? parsed.downloads : [],
          liked: Array.isArray(parsed.liked) ? parsed.liked : [],
          saved: Array.isArray(parsed.saved) ? parsed.saved : [],
        });
      } catch {
        // A missing or unreadable file simply means this is a new library.
      } finally {
        setHydrated(true);
      }
    };

    loadLibrary();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    RNFS.writeFile(libraryFilePath, JSON.stringify(items), 'utf8').catch(error =>
      console.warn('[Library] Could not save local library:', error),
    );
  }, [hydrated, items]);

  const addItem = useCallback((type: LibraryType, video: PlayInfo) => {
    setItems(current => ({ ...current, [type]: upsert(current[type], video) }));
  }, []);

  const toggleItem = useCallback((type: 'liked' | 'saved', video: PlayInfo) => {
    setItems(current => ({
      ...current,
      [type]: current[type].some(item => item.stream_url === video.stream_url)
        ? current[type].filter(item => item.stream_url !== video.stream_url)
        : upsert(current[type], video),
    }));
  }, []);

  const recordHistory = useCallback((video: PlayInfo) => addItem('history', video), [addItem]);
  const startDownload = useCallback((video: PlayInfo) => {
    setItems(current => ({
      ...current,
      downloads: [{ ...video, updatedAt: Date.now(), downloadStatus: 'downloading' }, ...current.downloads.filter(item => item.stream_url !== video.stream_url)],
    }));
  }, []);
  const addDownload = useCallback((video: PlayInfo) => {
    setItems(current => ({
      ...current,
      downloads: [{ ...video, updatedAt: Date.now(), downloadStatus: 'downloaded' }, ...current.downloads.filter(item => item.stream_url !== video.stream_url)],
    }));
  }, []);

  const hasItem = useCallback((type: 'liked' | 'saved', video: PlayInfo | null) =>
    !!video && items[type].some(item => item.stream_url === video.stream_url), [items]);
  const downloadStatus = useCallback((video: PlayInfo | null) => {
    if (!video) return 'idle' as const;
    return items.downloads.find(item => item.stream_url === video.stream_url)?.downloadStatus ?? 'idle';
  }, [items.downloads]);

  const value = useMemo(() => ({
    items,
    recordHistory,
    addDownload,
    startDownload,
    toggleItem,
    hasItem,
    downloadStatus,
  }), [addDownload, downloadStatus, hasItem, items, recordHistory, startDownload, toggleItem]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside LibraryProvider');
  return context;
}
