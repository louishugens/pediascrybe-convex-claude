"use client";

import { useMemo, useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  PlusCircle,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";

type AbnormalFlag = "normal" | "low" | "high" | "critical";

type Extracted = {
  examName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: AbnormalFlag;
  notes?: string;
};

type ReviewRow = Extracted & {
  matchedOrderId?: Id<"labOrders">; // null = will create a new order
};

export type AvailableOrder = {
  labOrderId: Id<"labOrders">;
  examName: string;
};

function normalizeName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Match an extracted exam name to an available ordered exam, if any.
// Strategy: case-insensitive + alphanumeric-only equality, then containment.
function matchOrder(
  extractedName: string,
  available: AvailableOrder[],
): Id<"labOrders"> | undefined {
  const target = normalizeName(extractedName);
  if (!target) return undefined;
  const exact = available.find((a) => normalizeName(a.examName) === target);
  if (exact) return exact.labOrderId;
  const contains = available.find((a) => {
    const candidate = normalizeName(a.examName);
    return candidate.includes(target) || target.includes(candidate);
  });
  return contains?.labOrderId;
}

export function LabResultUploadDialog({
  open,
  onOpenChange,
  patientId,
  appointmentId,
  patientName,
  visitLabel,
  availableOrders,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: Id<"patients">;
  appointmentId: Id<"appointments">;
  patientName: string;
  visitLabel: string;
  availableOrders: AvailableOrder[];
}) {
  const [phase, setPhase] = useState<"pick" | "extracting" | "review" | "saving">(
    "pick",
  );
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const commitBatch = useMutation(api.appointments.commitLabResultsBatch);
  const createFile = useMutation(api.files.createFile);

  const { startUpload, isUploading: isUtUploading } = useUploadThing(
    "labResultFile",
    {
      onUploadError: (err) => {
        console.error("Upload error", err);
      },
    },
  );

  const reset = () => {
    setPhase("pick");
    setFile(null);
    setRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
  };

  const runExtraction = async () => {
    if (!file) return;
    setPhase("extracting");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("orderedExams", JSON.stringify(availableOrders.map((o) => o.examName)));

      const res = await fetch("/api/ai/extract-lab-results", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? `Extraction failed (${res.status})`);
      }

      const json = (await res.json()) as { results: Extracted[] };
      if (!json.results || json.results.length === 0) {
        toast.error("No lab values could be extracted from this file.");
        setPhase("pick");
        return;
      }

      const matched: ReviewRow[] = json.results.map((r) => ({
        ...r,
        matchedOrderId: matchOrder(r.examName, availableOrders),
      }));
      setRows(matched);
      setPhase("review");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to extract results.");
      setPhase("pick");
    }
  };

  const updateRow = (index: number, patch: Partial<ReviewRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const matchedCount = useMemo(
    () => rows.filter((r) => r.matchedOrderId).length,
    [rows],
  );
  const newOrderCount = rows.length - matchedCount;

  const handleConfirm = async () => {
    if (rows.length === 0 || !file) return;
    setPhase("saving");
    try {
      // 1) Persist the original file via uploadthing → files row.
      let fileId: Id<"files"> | undefined;
      try {
        const uploaded = await startUpload([file]);
        const url = uploaded?.[0]?.ufsUrl ?? uploaded?.[0]?.url;
        if (url) {
          const fileType = file.type === "application/pdf" ? "PDF" : "IMAGE";
          fileId = (await createFile({
            appointmentId,
            url,
            name: file.name,
            fileType,
            sizeBytes: file.size,
          })) as Id<"files">;
        }
      } catch (uploadErr) {
        console.warn("File persistence failed; continuing with values only.", uploadErr);
      }

      // 2) Commit results (matched + new orders) atomically.
      const items = rows.map((r) => ({
        labOrderId: r.matchedOrderId,
        examName: r.matchedOrderId ? undefined : r.examName,
        patientId: r.matchedOrderId ? undefined : patientId,
        appointmentId: r.matchedOrderId ? undefined : appointmentId,
        value: r.value,
        unit: r.unit || undefined,
        referenceRange: r.referenceRange || undefined,
        abnormalFlag: r.abnormalFlag,
        notes: r.notes || undefined,
      }));

      const summary = await commitBatch({
        items,
        fileId,
        enteredBy: "lab_import",
      });
      toast.success(
        `Saved ${summary.resultsCreated} result${summary.resultsCreated > 1 ? "s" : ""}` +
          (summary.ordersCreated > 0
            ? ` · ${summary.ordersCreated} new order${summary.ordersCreated > 1 ? "s" : ""}`
            : ""),
      );
      reset();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to save results.");
      setPhase("review");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Upload result — {patientName}
          </DialogTitle>
          <DialogDescription>{visitLabel}</DialogDescription>
        </DialogHeader>

        {phase === "pick" && (
          <div className="space-y-4">
            <div
              className="rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">
                {file ? file.name : "Click to select a PDF or image"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {file
                  ? `${(file.size / 1024).toFixed(0)} KB`
                  : "We'll send it to AI to extract every value, then you review before saving."}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={handlePick}
              />
            </div>

            {availableOrders.length > 0 && (
              <div className="rounded-lg bg-muted/30 p-3 text-xs">
                <p className="font-medium mb-1">Ordered for this visit (used for matching):</p>
                <p className="text-muted-foreground">
                  {availableOrders.map((o) => o.examName).join(" · ")}
                </p>
              </div>
            )}
          </div>
        )}

        {phase === "extracting" && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="font-medium">Reading the document…</p>
            <p className="text-xs text-muted-foreground">
              AI is extracting values, units, reference ranges, and flags.
            </p>
          </div>
        )}

        {phase === "review" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{file?.name}</span>
              <span className="text-muted-foreground">·</span>
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {matchedCount} matched
              </Badge>
              {newOrderCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <PlusCircle className="h-3 w-3" />
                  {newOrderCount} new order{newOrderCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Review every value before saving. AI extraction is fast but not infallible — you are
              accountable for what gets recorded in the chart.
            </p>

            <div className="space-y-2">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{row.examName}</span>
                    {row.matchedOrderId ? (
                      <Badge variant="default" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        matches order
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <PlusCircle className="h-3 w-3" />
                        new order
                      </Badge>
                    )}
                    <div className="ml-auto flex items-center gap-1.5">
                      {availableOrders.length > 0 && (
                        <Select
                          value={row.matchedOrderId ? String(row.matchedOrderId) : "new"}
                          onValueChange={(v) =>
                            updateRow(i, {
                              matchedOrderId: v === "new" ? undefined : (v as Id<"labOrders">),
                            })
                          }
                        >
                          <SelectTrigger className="h-7 w-[180px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">— Create new order —</SelectItem>
                            {availableOrders.map((o) => (
                              <SelectItem key={o.labOrderId} value={String(o.labOrderId)}>
                                Match: {o.examName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeRow(i)}
                        aria-label="Remove this value"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                      <Label className="text-[11px] text-muted-foreground">Value</Label>
                      <Input
                        value={row.value}
                        onChange={(e) => updateRow(i, { value: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[11px] text-muted-foreground">Unit</Label>
                      <Input
                        value={row.unit ?? ""}
                        onChange={(e) => updateRow(i, { unit: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-[11px] text-muted-foreground">Ref range</Label>
                      <Input
                        value={row.referenceRange ?? ""}
                        onChange={(e) => updateRow(i, { referenceRange: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[11px] text-muted-foreground">Flag</Label>
                      <Select
                        value={row.abnormalFlag ?? "unset"}
                        onValueChange={(v) =>
                          updateRow(i, {
                            abnormalFlag: v === "unset" ? undefined : (v as AbnormalFlag),
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
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
                      <Label className="text-[11px] text-muted-foreground">Notes</Label>
                      <Textarea
                        rows={1}
                        value={row.notes ?? ""}
                        onChange={(e) => updateRow(i, { notes: e.target.value })}
                        className="min-h-[32px] h-8 resize-none text-sm"
                      />
                    </div>
                  </div>

                  {!row.matchedOrderId && (
                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Exam name (for new order)
                      </Label>
                      <Input
                        value={row.examName}
                        onChange={(e) => updateRow(i, { examName: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "saving" && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="font-medium">Saving results…</p>
            <p className="text-xs text-muted-foreground">
              {isUtUploading ? "Uploading the original file" : "Recording values"}
            </p>
          </div>
        )}

        <DialogFooter>
          {phase === "pick" && (
            <>
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={runExtraction} disabled={!file}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Extract with AI
              </Button>
            </>
          )}
          {phase === "review" && (
            <>
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={rows.length === 0}
              >
                Confirm · {rows.length} result{rows.length > 1 ? "s" : ""}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
