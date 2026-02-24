"use client";

import { useState, useEffect, useRef } from "react";
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSyncStatus } from "@/lib/offline/context/SyncStatusProvider";

export function NetworkStatusBanner() {
  const {
    isOnline,
    pendingCount,
    failedCount,
    conflictCount,
    isSyncing,
    triggerSync,
  } = useSyncStatus();

  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const wasOfflineRef = useRef(false);

  // Reset dismissed state when status changes
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setShowReconnected(false);
      setDismissed(false);
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      setDismissed(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Reset dismissed when sync status changes
  useEffect(() => {
    if (failedCount > 0 || conflictCount > 0) {
      setDismissed(false);
    }
  }, [failedCount, conflictCount]);

  if (dismissed) return null;

  // PRIORITY 1: Offline
  if (!isOnline) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-sm">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span className="flex-1">
          You&apos;re offline
          {pendingCount > 0 && ` \u2014 ${pendingCount} change${pendingCount > 1 ? "s" : ""} saved locally`}
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 rounded hover:bg-amber-200/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // PRIORITY 2: Syncing
  if (isSyncing) {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-blue-700 text-sm">
        <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
        <span className="flex-1">Syncing changes...</span>
      </div>
    );
  }

  // PRIORITY 3: Errors/conflicts
  if (failedCount > 0 || conflictCount > 0) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between text-red-700 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {failedCount > 0 && `${failedCount} sync error${failedCount > 1 ? "s" : ""}`}
            {failedCount > 0 && conflictCount > 0 && ", "}
            {conflictCount > 0 && `${conflictCount} conflict${conflictCount > 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-red-700 hover:text-red-800 hover:bg-red-100"
            onClick={triggerSync}
          >
            Retry
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-0.5 rounded hover:bg-red-200/50 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // PRIORITY 4: Pending sync items
  if (pendingCount > 0) {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between text-blue-700 text-sm">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 shrink-0" />
          <span>
            {pendingCount} change{pendingCount > 1 ? "s" : ""} waiting to sync
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-blue-700 hover:text-blue-800 hover:bg-blue-100"
            onClick={triggerSync}
          >
            Sync now
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-0.5 rounded hover:bg-blue-200/50 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // PRIORITY 5: Reconnected flash
  if (showReconnected) {
    return (
      <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2 text-green-700 text-sm animate-in fade-in slide-in-from-top-1 duration-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span className="flex-1">Back online</span>
        <button
          onClick={() => setShowReconnected(false)}
          className="p-0.5 rounded hover:bg-green-200/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
