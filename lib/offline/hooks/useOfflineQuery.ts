"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { offlineDb } from "../db";
import { useNetworkStatus } from "./useNetworkStatus";
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

type TableName = "doctors" | "patients" | "appointments" | "vaccins" | "doses" | "vaccinationRecords" | "services" | "charts" | "files" | "appUsers";

interface OfflineQueryOptions {
  // Which IndexedDB table to read/write cache
  table: TableName;
  // Optional filter function for reading from IndexedDB
  indexedDbFilter?: (item: any) => boolean;
  // Optional sort function for reading from IndexedDB
  indexedDbSort?: (a: any, b: any) => number;
}

export function useOfflineQuery<F extends FunctionReference<"query">>(
  fn: F,
  args: FunctionArgs<F> | "skip",
  options: OfflineQueryOptions
): FunctionReturnType<F> | undefined {
  const { isOnline } = useNetworkStatus();
  const [cachedData, setCachedData] = useState<any>(undefined);

  // When online, query Convex normally. When offline, skip to avoid stuck loading.
  const convexResult = useQuery(fn, isOnline ? args : "skip");

  // Cache-on-read: when online and we get data, write to IndexedDB
  useEffect(() => {
    if (!isOnline || convexResult === undefined || args === "skip") return;

    const cacheData = async () => {
      try {
        const table = offlineDb[options.table] as any;
        const now = Date.now();

        if (Array.isArray(convexResult)) {
          // Batch put for arrays
          const items = convexResult.map((item: any) => ({
            ...item,
            _cachedAt: now,
          }));
          await table.bulkPut(items);
        } else if (convexResult && typeof convexResult === "object" && "_id" in convexResult) {
          // Single document
          await table.put({
            ...(convexResult as any),
            _cachedAt: now,
          });
        }
      } catch (err) {
        console.warn("[Offline] Failed to cache data:", err);
      }
    };

    cacheData();
  }, [isOnline, convexResult, options.table, args]);

  // When offline, read from IndexedDB
  useEffect(() => {
    if (isOnline || args === "skip") return;

    const readCache = async () => {
      try {
        const table = offlineDb[options.table] as any;
        let items = await table.toArray();

        if (options.indexedDbFilter) {
          items = items.filter(options.indexedDbFilter);
        }
        if (options.indexedDbSort) {
          items.sort(options.indexedDbSort);
        }

        setCachedData(items);
      } catch (err) {
        console.warn("[Offline] Failed to read cache:", err);
        setCachedData([]);
      }
    };

    readCache();
  }, [isOnline, args, options.table, options.indexedDbFilter, options.indexedDbSort]);

  // When online, return real-time Convex data. When offline, return cached.
  if (isOnline) {
    return convexResult;
  }

  return cachedData;
}
