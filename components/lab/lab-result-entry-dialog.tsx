"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type AbnormalFlag = "normal" | "low" | "high" | "critical";

type ResultRow = {
  value: string;
  unit: string;
  referenceRange: string;
  abnormalFlag: AbnormalFlag | "";
  notes: string;
};

const emptyRow: ResultRow = {
  value: "",
  unit: "",
  referenceRange: "",
  abnormalFlag: "",
  notes: "",
};

export function LabResultEntryDialog({
  open,
  onOpenChange,
  labOrderId,
  examName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labOrderId: Id<"labOrders">;
  examName: string;
}) {
  const createResult = useMutation(api.appointments.createLabResult);
  const [rows, setRows] = useState<ResultRow[]>([{ ...emptyRow }]);
  const [submitting, setSubmitting] = useState(false);

  const updateRow = (index: number, patch: Partial<ResultRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { ...emptyRow }]);
  const removeRow = (index: number) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const reset = () => setRows([{ ...emptyRow }]);

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.value.trim().length > 0);
    if (validRows.length === 0) {
      toast.error("Enter at least one value.");
      return;
    }

    setSubmitting(true);
    try {
      for (const r of validRows) {
        await createResult({
          labOrderId,
          value: r.value.trim(),
          unit: r.unit.trim() || undefined,
          referenceRange: r.referenceRange.trim() || undefined,
          abnormalFlag: r.abnormalFlag || undefined,
          notes: r.notes.trim() || undefined,
        });
      }
      toast.success(`${validRows.length} result${validRows.length > 1 ? "s" : ""} recorded`);
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to record results");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter results — {examName}</DialogTitle>
          <DialogDescription>
            Add one row per measured value. Multi-component panels (e.g. CBC) can have several rows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={index}
              className="rounded-lg border bg-muted/30 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Value {index + 1}
                </span>
                {rows.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => removeRow(index)}
                    disabled={submitting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`value-${index}`}>Value</Label>
                  <Input
                    id={`value-${index}`}
                    placeholder="e.g. 12.4 or positive"
                    value={row.value}
                    onChange={(e) => updateRow(index, { value: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`unit-${index}`}>Unit</Label>
                  <Input
                    id={`unit-${index}`}
                    placeholder="g/dL, mg/L, …"
                    value={row.unit}
                    onChange={(e) => updateRow(index, { unit: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ref-${index}`}>Reference range</Label>
                  <Input
                    id={`ref-${index}`}
                    placeholder="e.g. 12-16"
                    value={row.referenceRange}
                    onChange={(e) => updateRow(index, { referenceRange: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`flag-${index}`}>Flag</Label>
                  <Select
                    value={row.abnormalFlag || "unset"}
                    onValueChange={(v) =>
                      updateRow(index, {
                        abnormalFlag: v === "unset" ? "" : (v as AbnormalFlag),
                      })
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger id={`flag-${index}`}>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">— (none)</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`notes-${index}`}>Notes (optional)</Label>
                <Textarea
                  id={`notes-${index}`}
                  rows={2}
                  placeholder="Interpretation, follow-up needed, …"
                  value={row.notes}
                  onChange={(e) => updateRow(index, { notes: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={submitting}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add another value
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Save results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
