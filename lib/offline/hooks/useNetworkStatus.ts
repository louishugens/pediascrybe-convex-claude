"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface NetworkStatus {
  isOnline: boolean;
  lastOnlineAt: number | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goOnlineDebounced = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    // Debounce going online to avoid flicker from unstable connections
    debounceTimer.current = setTimeout(() => {
      setIsOnline(true);
      setLastOnlineAt(Date.now());
    }, 2000);
  }, []);

  const goOfflineImmediate = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    // Go offline immediately — guard must activate before server fetches fail
    setIsOnline(false);
  }, []);

  useEffect(() => {
    // Set initial state without debounce
    setIsOnline(navigator.onLine);

    const handleOnline = () => goOnlineDebounced();
    const handleOffline = () => goOfflineImmediate();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [goOnlineDebounced, goOfflineImmediate]);

  return { isOnline, lastOnlineAt };
}
