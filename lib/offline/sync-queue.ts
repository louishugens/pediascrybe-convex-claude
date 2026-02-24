import { offlineDb } from "./db";
import type { SyncQueueEntry } from "./types";

export class SyncQueueManager {
  private processing = false;

  async enqueue(entry: Omit<SyncQueueEntry, "id">) {
    await offlineDb.syncQueue.add(entry as SyncQueueEntry);
  }

  async getPendingCount(): Promise<number> {
    return offlineDb.syncQueue.where("status").equals("pending").count();
  }

  async getFailedCount(): Promise<number> {
    return offlineDb.syncQueue.where("status").equals("failed").count();
  }

  async getConflictCount(): Promise<number> {
    return offlineDb.syncQueue.where("status").equals("conflict").count();
  }

  async getAllPending(): Promise<SyncQueueEntry[]> {
    return offlineDb.syncQueue
      .where("status")
      .anyOf(["pending", "failed"])
      .sortBy("createdAt");
  }

  async getAllConflicts(): Promise<SyncQueueEntry[]> {
    return offlineDb.syncQueue.where("status").equals("conflict").toArray();
  }

  async retry(id: number) {
    await offlineDb.syncQueue.update(id, {
      status: "pending",
      retryCount: 0,
      serverError: undefined,
      lastAttemptAt: undefined,
    });
  }

  async discard(id: number) {
    await offlineDb.syncQueue.delete(id);
  }

  async processQueue(
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ processed: number; failed: number; conflicts: number }> {
    if (this.processing) {
      return { processed: 0, failed: 0, conflicts: 0 };
    }

    this.processing = true;
    const result = { processed: 0, failed: 0, conflicts: 0 };

    try {
      const entries = await this.getAllPending();
      const total = entries.length;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (!entry.id) continue;

        // Mark as processing
        await offlineDb.syncQueue.update(entry.id, { status: "processing" });

        try {
          const fetchHeaders: Record<string, string> = {
            "Content-Type": "application/json",
          };
          // Include auth token if stored (for non-cookie auth flows)
          if (entry.authToken) {
            fetchHeaders["Authorization"] = `Bearer ${entry.authToken}`;
          }

          const response = await fetch(entry.apiRoute, {
            method: entry.method,
            headers: fetchHeaders,
            credentials: "include", // Ensure cookies are sent for same-origin auth
            body: JSON.stringify(entry.payload),
          });

          if (response.ok) {
            // Success — remove from queue
            await offlineDb.syncQueue.delete(entry.id);
            result.processed++;
          } else if (response.status === 401) {
            // Auth expired — stop processing, keep in queue
            await offlineDb.syncQueue.update(entry.id, { status: "pending" });
            break;
          } else if (response.status >= 400 && response.status < 500) {
            // Client error — mark as conflict
            const errorText = await response.text().catch(() => "Unknown error");
            await offlineDb.syncQueue.update(entry.id, {
              status: "conflict",
              serverError: errorText,
              lastAttemptAt: Date.now(),
            });
            result.conflicts++;
          } else {
            // Server error — mark as failed, increment retry
            await offlineDb.syncQueue.update(entry.id, {
              status: "failed",
              retryCount: (entry.retryCount || 0) + 1,
              serverError: `Server error: ${response.status}`,
              lastAttemptAt: Date.now(),
            });
            result.failed++;
          }
        } catch (err) {
          // Network error — mark as failed
          await offlineDb.syncQueue.update(entry.id, {
            status: "failed",
            retryCount: (entry.retryCount || 0) + 1,
            serverError: err instanceof Error ? err.message : "Network error",
            lastAttemptAt: Date.now(),
          });
          result.failed++;
        }

        onProgress?.(i + 1, total);
      }
    } finally {
      this.processing = false;
    }

    return result;
  }
}

export const syncQueueManager = new SyncQueueManager();
