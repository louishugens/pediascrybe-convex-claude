"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { offlineDb } from "../db";
import { useNetworkStatus } from "./useNetworkStatus";
import type { SyncQueueEntry } from "../types";

interface OfflineMutationOptions {
  apiRoute: string;
  method?: "POST" | "PUT" | "PATCH";
  // Table to apply optimistic update to
  optimisticTable?: "appointments" | "patients" | "vaccinationRecords";
  // Function to build the optimistic document from the payload
  buildOptimisticDoc?: (payload: Record<string, unknown>) => Record<string, unknown>;
  // For conflict resolution
  entityType?: string;
}

interface MutationResult {
  success: boolean;
  offline: boolean;
  data?: unknown;
  error?: string;
}

export function useOfflineMutation(options: OfflineMutationOptions) {
  const { isOnline } = useNetworkStatus();

  const mutate = useCallback(
    async (payload: Record<string, unknown>): Promise<MutationResult> => {
      if (isOnline) {
        // Online: normal fetch
        try {
          const response = await fetch(options.apiRoute, {
            method: options.method || "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return { success: false, offline: false, error: errorText };
          }

          const data = await response.json().catch(() => ({}));
          return { success: true, offline: false, data };
        } catch (err) {
          // Network error while supposedly online — fall through to offline path
          if (err instanceof TypeError && err.message.includes("fetch")) {
            // Actual network failure, queue it
          } else {
            return {
              success: false,
              offline: false,
              error: err instanceof Error ? err.message : "Unknown error",
            };
          }
        }
      }

      // Offline: optimistic update + queue
      try {
        // Apply optimistic update to IndexedDB
        if (options.optimisticTable && options.buildOptimisticDoc) {
          const doc = options.buildOptimisticDoc(payload);
          if (doc._id) {
            const table = offlineDb[options.optimisticTable];
            await table.put(doc as any);
          }
        }

        // Enqueue for sync
        const entry: SyncQueueEntry = {
          apiRoute: options.apiRoute,
          method: options.method || "POST",
          payload,
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          entityType: options.entityType,
          createdAt: Date.now(),
        };
        await offlineDb.syncQueue.add(entry);

        toast.info("Saved offline. Will sync when back online.");

        return { success: true, offline: true };
      } catch (err) {
        console.error("[Offline] Failed to queue mutation:", err);
        return {
          success: false,
          offline: true,
          error: err instanceof Error ? err.message : "Failed to save offline",
        };
      }
    },
    [isOnline, options]
  );

  return { mutate, isOnline };
}
