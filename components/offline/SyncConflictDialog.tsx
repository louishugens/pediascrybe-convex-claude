"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { syncQueueManager } from "@/lib/offline/sync-queue";
import type { SyncQueueEntry } from "@/lib/offline/types";

// Fields that can be auto-merged (low risk)
const AUTO_MERGE_FIELDS = new Set([
  "height", "weight", "head", "arm", "sao2", "temperature",
  "pulse", "respiratory", "systolic", "diastolic", "cost", "status",
]);

// Fields requiring manual resolution
const MANUAL_FIELDS = new Set([
  "findings", "medication", "exams", "recommendation", "internalNotes",
]);

interface SyncConflictDialogProps {
  entry: SyncQueueEntry | null;
  onResolve: () => void;
  onClose: () => void;
}

export function SyncConflictDialog({
  entry,
  onResolve,
  onClose,
}: SyncConflictDialogProps) {
  const [resolvedFields, setResolvedFields] = useState<Record<string, "local" | "server">>({});

  if (!entry || !entry.localSnapshot || !entry.serverSnapshot) {
    return null;
  }

  const local = entry.localSnapshot;
  const server = entry.serverSnapshot;

  // Find conflicting fields
  const conflicts: { field: string; localValue: unknown; serverValue: unknown; isManual: boolean }[] = [];

  for (const field of Object.keys(local)) {
    if (field.startsWith("_")) continue;
    const localVal = local[field];
    const serverVal = server[field];

    if (JSON.stringify(localVal) !== JSON.stringify(serverVal)) {
      conflicts.push({
        field,
        localValue: localVal,
        serverValue: serverVal,
        isManual: MANUAL_FIELDS.has(field),
      });
    }
  }

  const handleResolve = async (choice: "local" | "server") => {
    if (!entry.id) return;

    if (choice === "server") {
      // Discard local changes
      await syncQueueManager.discard(entry.id);
    } else {
      // Retry with local changes
      await syncQueueManager.retry(entry.id);
    }

    onResolve();
  };

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return "(empty)";
    if (typeof val === "object") return JSON.stringify(val).slice(0, 100) + "...";
    return String(val);
  };

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sync Conflict</DialogTitle>
          <DialogDescription>
            This record was modified on the server while you were offline.
            Choose which version to keep for each field.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {conflicts.map(({ field, localValue, serverValue, isManual }) => (
            <div key={field} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium capitalize">
                  {field.replace(/([A-Z])/g, " $1")}
                </span>
                {isManual && (
                  <Badge variant="outline" className="text-xs">
                    Requires review
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`text-left rounded-md border p-2 text-xs transition-colors ${
                    resolvedFields[field] === "local"
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() =>
                    setResolvedFields((prev) => ({ ...prev, [field]: "local" }))
                  }
                >
                  <p className="font-medium text-muted-foreground mb-1">
                    Your version (offline)
                  </p>
                  <p className="break-words">{formatValue(localValue)}</p>
                </button>

                <button
                  className={`text-left rounded-md border p-2 text-xs transition-colors ${
                    resolvedFields[field] === "server"
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() =>
                    setResolvedFields((prev) => ({ ...prev, [field]: "server" }))
                  }
                >
                  <p className="font-medium text-muted-foreground mb-1">
                    Server version
                  </p>
                  <p className="break-words">{formatValue(serverValue)}</p>
                </button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleResolve("server")}>
            Keep server version
          </Button>
          <Button onClick={() => handleResolve("local")}>
            Keep my changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
