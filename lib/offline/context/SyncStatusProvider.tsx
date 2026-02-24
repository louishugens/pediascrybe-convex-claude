"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { syncQueueManager } from "../sync-queue";
import { offlineDb } from "../db";
import type { SyncStatus } from "../types";

interface SyncStatusContextValue extends SyncStatus {
  triggerSync: () => Promise<void>;
  lastSyncResult?: { processed: number; failed: number; conflicts: number };
}

const SyncStatusContext = createContext<SyncStatusContextValue>({
  isOnline: true,
  pendingCount: 0,
  failedCount: 0,
  conflictCount: 0,
  isSyncing: false,
  triggerSync: async () => {},
});

export function useSyncStatus() {
  return useContext(SyncStatusContext);
}

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    processed: number;
    failed: number;
    conflicts: number;
  }>();
  const wasOffline = useRef(false);

  // Refresh counts from IndexedDB
  const refreshCounts = useCallback(async () => {
    try {
      const [pending, failed, conflict] = await Promise.all([
        syncQueueManager.getPendingCount(),
        syncQueueManager.getFailedCount(),
        syncQueueManager.getConflictCount(),
      ]);
      setPendingCount(pending);
      setFailedCount(failed);
      setConflictCount(conflict);
    } catch {
      // IndexedDB might not be available
    }
  }, []);

  // Sync when coming back online
  const triggerSync = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      const result = await syncQueueManager.processQueue((processed, total) => {
        // Progress callback - refresh counts during sync
        refreshCounts();
      });
      setLastSyncResult(result);
    } finally {
      setIsSyncing(false);
      await refreshCounts();
    }
  }, [isSyncing, isOnline, refreshCounts]);

  // Refresh counts periodically
  useEffect(() => {
    refreshCounts();
    const interval = setInterval(refreshCounts, 5000);
    return () => clearInterval(interval);
  }, [refreshCounts]);

  // Auto-sync when coming back online (with debounce)
  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      const timer = setTimeout(() => {
        triggerSync();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, triggerSync]);

  // Listen for IndexedDB changes via Dexie observable
  useEffect(() => {
    const handleChange = () => refreshCounts();
    // Simple polling fallback since Dexie observable requires addon
    const interval = setInterval(handleChange, 3000);
    return () => clearInterval(interval);
  }, [refreshCounts]);

  return (
    <SyncStatusContext.Provider
      value={{
        isOnline,
        pendingCount,
        failedCount,
        conflictCount,
        isSyncing,
        triggerSync,
        lastSyncResult,
      }}
    >
      {children}
    </SyncStatusContext.Provider>
  );
}
