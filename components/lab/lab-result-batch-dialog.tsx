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

const emptyRow = (): ResultRow => ({
  value: "",
  unit: "",
  referenceRange: "",
  abnormalFlag: "",
  notes: "",
});

export type BatchExam = {
  labOrderId: Id<"labOrders">;
  examName: string;
};

export function LabResultBatchDialog({
  open,
  onOpenChange,
  exams,
  visitLabel,
  patientName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exams: BatchExam[];
  visitLabel: string;
  patientName: string;
}) {
  const createResult = useMutation(api.appointments.createLabResult);
  const [perExam, setPerExam] = useState<Record<string, ResultRow[]>>(() =>
    Object.fromEntries(exams.map((e) => [e.labOrderId, [emptyRow()]])),
  );
  const [submitting, setSubmitting] = useState(false);

  const updateRow = (
    labOrderId: Id<"labOrders">,
    index: number,
    patch: Partial<ResultRow>,
  ) => {
    setPerExam((prev) => ({
      ...prev,
      [labOrderId]: prev[labOrderId].map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  };

  const addRow = (labOrderId: Id<"labOrders">) => {
    setPerExam((prev) => ({
      ...prev,
      [labOrderId]: [...prev[labOrderId], emptyRow()],
    }));
  };

  const removeRow = (labOrderId: Id<"labOrders">, index: number) => {
    setPerExam((prev) => {
      const rows = prev[labOrderId];
      if (rows.length === 1) return prev;
      return { ...prev, [labOrderId]: rows.filter((_, i) => i !== index) };
    });
  };

  const reset = () =>
    setPerExam(Object.fromEntries(exams.map((e) => [e.labOrderId, [emptyRow()]])));

  const handleSubmit = async () => {
    type Pending = { labOrderId: Id<"labOrders">; row: ResultRow };
    const pending: Pending[] = [];
    for (const exam of exams) {
      const rows = perExam[exam.labOrderId] ?? [];
      for (const row of rows) {
        if (row.value.trim().length > 0) {
          pending.push({ labOrderId: exam.labOrderId, row });
        }
      }
    }

    if (pending.length === 0) {
      toast.error("Enter at least one value across the panel.");
      return;
    }

    setSubmitting(true);
    try {
      for (const { labOrderId, row } of pending) {
        await createResult({
          labOrderId,
          value: row.value.trim(),
          unit: row.unit.trim() || undefined,
          referenceRange: row.referenceRange.trim() || undefined,
          abnormalFlag: row.abnormalFlag || undefined,
          notes: row.notes.trim() || undefined,
        });
      }
      toast.success(
        `${pending.length} result${pending.length > 1 ? "s" : ""} recorded`,
      );
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter results — {patientName}</DialogTitle>
          <DialogDescription>{visitLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {exams.map((exam) => {
            const rows = perExam[exam.labOrderId] ?? [];
            return (
              <section key={exam.labOrderId} className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <h3 className="font-semibold">{exam.examName}</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => addRow(exam.labOrderId)}
                    disabled={submitting}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add value
                  </Button>
                </div>
                <div className="space-y-2">
                  {rows.map((row, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-start rounded-md border bg-muted/20 p-2"
                    >
                      <div className="col-span-3">
                        <Label
                          htmlFor={`v-${exam.labOrderId}-${index}`}
                          className="text-[11px] text-muted-foreground"
                        >
                          Value
                        </Label>
                        <Input
                          id={`v-${exam.labOrderId}-${index}`}
                          placeholder="12.4 or positive"
                          value={row.value}
                          onChange={(e) =>
                            updateRow(exam.labOrderId, index, { value: e.target.value })
                          }
                          disabled={submitting}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label
                          htmlFor={`u-${exam.labOrderId}-${index}`}
                          className="text-[11px] text-muted-foreground"
                        >
                          Unit
                        </Label>
                        <Input
                          id={`u-${exam.labOrderId}-${index}`}
                          placeholder="g/dL"
                          value={row.unit}
                          onChange={(e) =>
                            updateRow(exam.labOrderId, index, { unit: e.target.value })
                          }
                          disabled={submitting}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label
                          htmlFor={`r-${exam.labOrderId}-${index}`}
                          className="text-[11px] text-muted-foreground"
                        >
                          Ref range
                        </Label>
                        <Input
                          id={`r-${exam.labOrderId}-${index}`}
                          placeholder="12-16"
                          value={row.referenceRange}
                          onChange={(e) =>
                            updateRow(exam.labOrderId, index, {
                              referenceRange: e.target.value,
                            })
                          }
                          disabled={submitting}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label
                          htmlFor={`f-${exam.labOrderId}-${index}`}
                          className="text-[11px] text-muted-foreground"
                        >
                          Flag
                        </Label>
                        <Select
                          value={row.abnormalFlag || "unset"}
                          onValueChange={(v) =>
                            updateRow(exam.labOrderId, index, {
                              abnormalFlag: v === "unset" ? "" : (v as AbnormalFlag),
                            })
                          }
                          disabled={submitting}
                        >
                          <SelectTrigger id={`f-${exam.labOrderId}-${index}`} className="h-8">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unset">—</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label
                          htmlFor={`n-${exam.labOrderId}-${index}`}
                          className="text-[11px] text-muted-foreground"
                        >
                          Notes
                        </Label>
                        <Textarea
                          id={`n-${exam.labOrderId}-${index}`}
                          rows={1}
                          placeholder="Optional"
                          value={row.notes}
                          onChange={(e) =>
                            updateRow(exam.labOrderId, index, { notes: e.target.value })
                          }
                          disabled={submitting}
                          className="min-h-[32px] h-8 resize-none text-sm"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end pt-5">
                        {rows.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeRow(exam.labOrderId, index)}
                            disabled={submitting}
                            aria-label="Remove value"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Save all results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
