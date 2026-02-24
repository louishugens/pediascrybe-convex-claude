"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { syncQueueManager } from "@/lib/offline/sync-queue";
import { useSyncStatus } from "@/lib/offline/context/SyncStatusProvider";
import type { SyncQueueEntry } from "@/lib/offline/types";
import { format } from "date-fns";

interface SyncQueuePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncQueuePanel({ open, onOpenChange }: SyncQueuePanelProps) {
  const { triggerSync, isSyncing } = useSyncStatus();
  const [entries, setEntries] = useState<SyncQueueEntry[]>([]);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const [pending, conflicts] = await Promise.all([
        syncQueueManager.getAllPending(),
        syncQueueManager.getAllConflicts(),
      ]);
      setEntries([...conflicts, ...pending]);
    };

    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [open]);

  const handleRetry = async (id: number) => {
    await syncQueueManager.retry(id);
    await triggerSync();
  };

  const handleDiscard = async (id: number) => {
    await syncQueueManager.discard(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const statusConfig = {
    pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
    processing: { label: "Syncing", variant: "default" as const, icon: RefreshCw },
    failed: { label: "Failed", variant: "destructive" as const, icon: XCircle },
    conflict: { label: "Conflict", variant: "outline" as const, icon: AlertTriangle },
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sync Queue</SheetTitle>
          <SheetDescription>
            Changes saved while offline waiting to be synced
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pending changes
            </p>
          ) : (
            entries.map((entry) => {
              const config = statusConfig[entry.status];
              const Icon = config.icon;

              return (
                <div
                  key={entry.id}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {entry.method} {entry.apiRoute.split("/").pop()}
                      </span>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {format(entry.createdAt, "MMM d, h:mm a")}
                    {entry.retryCount > 0 && ` \u2022 ${entry.retryCount} retries`}
                  </p>

                  {entry.serverError && (
                    <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
                      {entry.serverError}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleRetry(entry.id!)}
                      disabled={isSyncing}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDiscard(entry.id!)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Discard
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
