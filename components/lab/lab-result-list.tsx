"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";

const FLAG_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  normal: "secondary",
  low: "default",
  high: "default",
  critical: "destructive",
};

export function LabResultList({ labOrderId }: { labOrderId: Id<"labOrders"> }) {
  const results = useQuery(api.appointments.listLabResultsByOrder, { labOrderId });

  if (results === undefined) {
    return <p className="text-xs text-muted-foreground">Loading results…</p>;
  }
  if (results.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No results entered yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {results.map((r) => (
        <li
          key={r._id}
          className="flex items-start justify-between gap-3 rounded-md border bg-background px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium">{r.value}</span>
              {r.unit && <span className="text-sm text-muted-foreground">{r.unit}</span>}
              {r.referenceRange && (
                <span className="text-xs text-muted-foreground">(ref: {r.referenceRange})</span>
              )}
              {r.abnormalFlag && r.abnormalFlag !== "normal" && (
                <Badge variant={FLAG_VARIANT[r.abnormalFlag] ?? "default"} className="text-[10px]">
                  <AlertCircle className="h-2.5 w-2.5 mr-1" />
                  {r.abnormalFlag}
                </Badge>
              )}
              {r.abnormalFlag === "normal" && (
                <Badge variant="secondary" className="text-[10px]">normal</Badge>
              )}
            </div>
            {r.notes && (
              <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {format(r.enteredAt, "MMM d, yyyy")}
          </span>
        </li>
      ))}
    </ul>
  );
}
