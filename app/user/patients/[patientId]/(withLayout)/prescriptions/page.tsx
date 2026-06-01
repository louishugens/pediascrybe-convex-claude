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
  Pill,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Status = "active" | "completed" | "discontinued" | "cancelled";

type Script = {
  _id: Id<"prescriptions">;
  drug: string;
  count: number;
  unit: string;
  posology: string;
  dose?: string;
  route?: string;
  status: Status;
  appointmentId?: Id<"appointments">;
  createdAt: number;
};

type Visit = {
  key: string;
  appointmentId?: string;
  visitDate?: number;
  motif?: string;
  scripts: Script[];
};

type Params = Promise<{ patientId: string }>;

export default function PatientPrescriptionsPage({ params }: { params: Params }) {
  const { patientId } = use(params);
  const pid = patientId as Id<"patients">;

  const patient = useQuery(api.patients.getPatient, { patientId: pid });
  const data = useQuery(api.appointments.getPatientPrescriptions, { patientId: pid });
  const discontinue = useMutation(api.appointments.discontinuePrescription);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const [openVisitKey, setOpenVisitKey] = useState<string | null>(null);
  const didInitOpen = useRef(false);

  const handleDiscontinue = async (prescriptionId: Id<"prescriptions">) => {
    setBusyId(prescriptionId);
    try {
      await discontinue({ prescriptionId });
      toast.success("Discontinued");
    } catch (err) {
      toast.error("Failed to discontinue");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const visibleVisits = useMemo<Visit[]>(() => {
    if (!data) return [];
    if (!activeOnly) return data.visits;
    return data.visits
      .map((v) => ({
        ...v,
        scripts: v.scripts.filter((s) => s.status === "active"),
      }))
      .filter((v) => v.scripts.length > 0);
  }, [data, activeOnly]);

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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/user/patients/${patientId}` as any}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Pill className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Prescriptions</h1>
            <p className="text-sm text-muted-foreground">{patientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.activeCount > 0 && (
            <Badge variant="default">{data.activeCount} active</Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveOnly((s) => !s)}
          >
            {activeOnly ? "Show all" : "Active only"}
          </Button>
          <Button asChild size="sm">
            <Link href={`/user/patients/${patientId}/add-prescription` as any}>
              <Plus className="h-4 w-4 mr-1" />
              New prescription
            </Link>
          </Button>
        </div>
      </div>

      {visibleVisits.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <Pill className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {data.visits.length === 0
              ? "No prescriptions for this patient yet."
              : "No active prescriptions. Toggle 'Show all' to see history."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          {visibleVisits.map((visit) => {
            const visitLabel = visit.visitDate
              ? format(visit.visitDate, "MMM d, yyyy")
              : "Standalone";
            const isOpen = openVisitKey === visit.key;
            return (
              <Collapsible
                key={visit.key}
                open={isOpen}
                onOpenChange={(open) => setOpenVisitKey(open ? visit.key : null)}
                className="bg-muted/20"
              >
                <header className="flex items-center justify-between px-2 py-2 bg-muted/40 flex-wrap gap-2">
                  <CollapsibleTrigger className="flex items-center gap-2 min-w-0 flex-1 px-2 py-1 rounded hover:bg-muted/60 transition-colors text-left">
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
                      {visit.scripts.length}
                    </Badge>
                  </CollapsibleTrigger>
                  {visit.appointmentId && (
                    <Link
                      href={`/user/patients/${patientId}/${visit.appointmentId}` as any}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline px-2"
                    >
                      Open visit
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </header>

                <CollapsibleContent>
                  <ul className="divide-y">
                    {visit.scripts.map((s) => {
                      const isBusy = busyId === s._id;
                      return (
                        <li key={s._id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{s.drug}</span>
                                {s.dose && (
                                  <span className="text-xs text-muted-foreground">{s.dose}</span>
                                )}
                                <StatusBadge status={s.status} />
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {s.count} {s.unit} · {s.posology}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {s.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-destructive hover:text-destructive"
                                  disabled={isBusy}
                                  onClick={() => handleDiscontinue(s._id)}
                                >
                                  {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Discontinue"}
                                </Button>
                              )}
                            </div>
                          </div>
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
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { variant: "default" | "secondary" | "destructive"; label: string }> = {
    active: { variant: "default", label: "active" },
    completed: { variant: "secondary", label: "completed" },
    discontinued: { variant: "secondary", label: "discontinued" },
    cancelled: { variant: "secondary", label: "cancelled" },
  };
  const c = map[status];
  return (
    <Badge variant={c.variant} className="text-[10px]">
      {c.label}
    </Badge>
  );
}
