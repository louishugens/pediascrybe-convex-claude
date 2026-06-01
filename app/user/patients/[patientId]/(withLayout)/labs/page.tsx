"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import {
  FlaskConical,
  Loader2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Eye,
  Upload,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { LabResultEntryDialog } from "@/components/lab/lab-result-entry-dialog";
import {
  LabResultBatchDialog,
  type BatchExam,
} from "@/components/lab/lab-result-batch-dialog";
import { LabResultList } from "@/components/lab/lab-result-list";
import {
  LabResultUploadDialog,
  type AvailableOrder,
} from "@/components/lab/lab-result-upload-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Status = "ordered" | "collected" | "resulted" | "reviewed" | "cancelled";
type Urgency = "routine" | "urgent" | "stat";

type Order = {
  _id: Id<"labOrders">;
  examName: string;
  status: Status;
  patientId: Id<"patients">;
  appointmentId?: Id<"appointments">;
  orderedAt?: number;
  createdAt: number;
  urgency?: Urgency;
};

type Visit = {
  key: string;
  appointmentId?: string;
  visitDate?: number;
  motif?: string;
  orders: Order[];
};

type Params = Promise<{ patientId: string }>;

export default function PatientLabsPage({ params }: { params: Params }) {
  const { patientId } = use(params);
  const pid = patientId as Id<"patients">;

  const patient = useQuery(api.patients.getPatient, { patientId: pid });
  const data = useQuery(api.appointments.getPatientLabs, { patientId: pid });
  const updateStatus = useMutation(api.appointments.updateLabOrderStatus);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [showReviewed, setShowReviewed] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [openVisitKey, setOpenVisitKey] = useState<string | null>(null);
  const didInitOpen = useRef(false);
  const [batchTarget, setBatchTarget] = useState<{
    exams: BatchExam[];
    visitLabel: string;
    patientName: string;
  } | null>(null);
  const [singleTarget, setSingleTarget] = useState<{
    id: Id<"labOrders">;
    examName: string;
  } | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    appointmentId: Id<"appointments">;
    visitLabel: string;
    availableOrders: AvailableOrder[];
  } | null>(null);

  const advance = async (
    labOrderId: Id<"labOrders">,
    next: "collected" | "resulted" | "reviewed" | "cancelled",
  ) => {
    setBusyId(labOrderId);
    try {
      await updateStatus({ labOrderId, status: next });
      toast.success(`Marked ${next}`);
    } catch (err) {
      toast.error("Failed to update lab status");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const toggleResults = (key: string) =>
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const visibleVisits = useMemo<Visit[]>(() => {
    if (!data) return [];
    if (showReviewed) return data.visits;
    return data.visits
      .map((v) => ({
        ...v,
        orders: v.orders.filter((o) => o.status !== "reviewed"),
      }))
      .filter((v) => v.orders.length > 0);
  }, [data, showReviewed]);

  // Open the first (most recent) visit once on initial load. After that the
  // user is in control — they can close everything, or open one at a time.
  // If the currently open visit disappears (e.g. filtered out), just clear it.
  useEffect(() => {
    if (visibleVisits.length === 0) {
      if (openVisitKey !== null) setOpenVisitKey(null);
      return;
    }
    if (!didInitOpen.current) {
      didInitOpen.current = true;
      setOpenVisitKey(visibleVisits[0].key);
      return;
    }
    if (openVisitKey !== null && !visibleVisits.some((v) => v.key === openVisitKey)) {
      setOpenVisitKey(null);
    }
  }, [visibleVisits, openVisitKey]);

  if (data === undefined || patient === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!patient) {
    return <div className="p-6 text-sm text-muted-foreground">Patient not found.</div>;
  }

  const patientName = `${patient.firstname} ${patient.lastname}`;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/user/patients/${patientId}` as any}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <FlaskConical className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Labs</h1>
            <p className="text-sm text-muted-foreground">{patientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.hasStat && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              stat
            </Badge>
          )}
          {data.awaitingReviewCount > 0 && (
            <Badge variant="default" className="gap-1">
              <Eye className="h-3 w-3" />
              {data.awaitingReviewCount} to review
            </Badge>
          )}
          {data.pendingCount > 0 && (
            <Badge variant="secondary">{data.pendingCount} pending</Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowReviewed((s) => !s)}
          >
            {showReviewed ? "Hide reviewed" : "Show reviewed"}
          </Button>
          <Button asChild size="sm">
            <Link href={`/user/patients/${patientId}/add-exams` as any}>
              <Plus className="h-4 w-4 mr-1" />
              New lab order
            </Link>
          </Button>
        </div>
      </div>

      {visibleVisits.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <FlaskConical className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {data.visits.length === 0
              ? "No lab orders for this patient yet."
              : "No active labs. Toggle 'Show reviewed' to see history."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          {visibleVisits.map((visit) => {
            const visitLabel = visit.visitDate
              ? format(visit.visitDate, "MMM d, yyyy")
              : "Standalone order";
            const allOrdered = visit.orders.every((o) => o.status === "ordered");
            const hasEnterable = visit.orders.some(
              (o) => o.status === "ordered" || o.status === "collected",
            );
            const isOpen = openVisitKey === visit.key;
            return (
              <Collapsible
                key={visit.key}
                open={isOpen}
                onOpenChange={(open) => setOpenVisitKey(open ? visit.key : null)}
                className="bg-muted/20"
              >
                <header className="flex items-center justify-between px-2 py-2 bg-muted/40 flex-wrap gap-2">
                  <CollapsibleTrigger className="flex items-center gap-2 min-w-0 flex-1 px-2 py-1 rounded hover:bg-muted/60 transition-colors text-left group">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm font-medium">{visitLabel}</span>
                    {visit.motif && (
                      <span className="text-sm text-muted-foreground truncate">
                        · {visit.motif}
                      </span>
                    )}
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      {visit.orders.length}
                    </Badge>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-2 shrink-0">
                    {visit.appointmentId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() => {
                          const available: AvailableOrder[] = visit.orders
                            .filter(
                              (o) =>
                                o.status === "ordered" ||
                                o.status === "collected" ||
                                o.status === "resulted",
                            )
                            .map((o) => ({ labOrderId: o._id, examName: o.examName }));
                          setUploadTarget({
                            appointmentId: visit.appointmentId as Id<"appointments">,
                            visitLabel: visit.visitDate
                              ? `Visit · ${format(visit.visitDate, "MMM d, yyyy")}${visit.motif ? ` · ${visit.motif}` : ""}`
                              : "Visit",
                            availableOrders: available,
                          });
                        }}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Upload result
                      </Button>
                    )}
                    {hasEnterable && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7"
                        onClick={() => {
                          const exams: BatchExam[] = visit.orders
                            .filter((o) => o.status === "ordered" || o.status === "collected")
                            .map((o) => ({ labOrderId: o._id, examName: o.examName }));
                          if (exams.length === 0) return;
                          setBatchTarget({
                            exams,
                            visitLabel: visit.visitDate
                              ? `Visit · ${format(visit.visitDate, "MMM d, yyyy")}${visit.motif ? ` · ${visit.motif}` : ""}`
                              : "Standalone order",
                            patientName,
                          });
                        }}
                      >
                        Enter results
                      </Button>
                    )}
                    {allOrdered && visit.orders.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() => {
                          for (const o of visit.orders) advance(o._id, "collected");
                        }}
                      >
                        Mark all collected
                      </Button>
                    )}
                    {visit.appointmentId && (
                      <Link
                        href={`/user/patients/${patientId}/${visit.appointmentId}` as any}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline px-2"
                      >
                        Open visit
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </header>

                <CollapsibleContent>
                <ul className="divide-y">
                  {visit.orders.map((o) => {
                    const showResults = o.status === "resulted" || o.status === "reviewed";
                    const isResultsOpen = expandedResults.has(o._id);
                    const isBusy = busyId === o._id;
                    return (
                      <li key={o._id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{o.examName}</span>
                              <StatusBadge status={o.status} />
                              {o.urgency && o.urgency !== "routine" && (
                                <Badge
                                  variant={o.urgency === "stat" ? "destructive" : "default"}
                                  className="text-[10px]"
                                >
                                  {o.urgency}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {o.status === "ordered" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7"
                                disabled={isBusy}
                                onClick={() => advance(o._id, "collected")}
                              >
                                {isBusy ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Mark collected"
                                )}
                              </Button>
                            )}
                            {(o.status === "ordered" || o.status === "collected") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7"
                                disabled={isBusy}
                                onClick={() => setSingleTarget({ id: o._id, examName: o.examName })}
                              >
                                Enter
                              </Button>
                            )}
                            {o.status === "resulted" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7"
                                  onClick={() => toggleResults(o._id)}
                                >
                                  {isResultsOpen ? "Hide" : "Show"} values
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7"
                                  disabled={isBusy}
                                  onClick={() => setSingleTarget({ id: o._id, examName: o.examName })}
                                >
                                  Add value
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7"
                                  disabled={isBusy}
                                  onClick={() => advance(o._id, "reviewed")}
                                >
                                  Mark reviewed
                                </Button>
                              </>
                            )}
                            {o.status === "reviewed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7"
                                onClick={() => toggleResults(o._id)}
                              >
                                {isResultsOpen ? "Hide" : "Show"} values
                              </Button>
                            )}
                            {o.status !== "reviewed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-destructive hover:text-destructive"
                                disabled={isBusy}
                                onClick={() => advance(o._id, "cancelled")}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>

                        {showResults && isResultsOpen && (
                          <div className="mt-3 pl-4 border-l-2 border-primary/30">
                            <LabResultList labOrderId={o._id} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {batchTarget && (
        <LabResultBatchDialog
          open={!!batchTarget}
          onOpenChange={(open) => !open && setBatchTarget(null)}
          exams={batchTarget.exams}
          visitLabel={batchTarget.visitLabel}
          patientName={batchTarget.patientName}
        />
      )}
      {singleTarget && (
        <LabResultEntryDialog
          open={!!singleTarget}
          onOpenChange={(open) => !open && setSingleTarget(null)}
          labOrderId={singleTarget.id}
          examName={singleTarget.examName}
        />
      )}
      {uploadTarget && (
        <LabResultUploadDialog
          open={!!uploadTarget}
          onOpenChange={(open) => !open && setUploadTarget(null)}
          patientId={pid}
          appointmentId={uploadTarget.appointmentId}
          patientName={patientName}
          visitLabel={uploadTarget.visitLabel}
          availableOrders={uploadTarget.availableOrders}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { variant: "default" | "secondary" | "destructive"; label: string }> = {
    ordered: { variant: "secondary", label: "ordered" },
    collected: { variant: "secondary", label: "collected" },
    resulted: { variant: "default", label: "resulted" },
    reviewed: { variant: "secondary", label: "reviewed" },
    cancelled: { variant: "secondary", label: "cancelled" },
  };
  const c = map[status];
  return (
    <Badge variant={c.variant} className="text-[10px]">
      {c.label}
    </Badge>
  );
}
