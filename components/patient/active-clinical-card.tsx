"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Pill, FlaskConical, RotateCcw, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface ActiveClinicalCardProps {
  patientId: string;
}

export default function ActiveClinicalCard({ patientId }: ActiveClinicalCardProps) {
  const id = patientId as Id<"patients">;
  const prescriptions = useQuery(api.appointments.listActivePrescriptionsByPatient, {
    patientId: id,
  });
  const allLabOrders = useQuery(api.appointments.listLabOrdersByPatient, { patientId: id });
  const pendingLabs = allLabOrders?.filter(
    (o) => o.status === "ordered" || o.status === "collected",
  );

  const discontinue = useMutation(api.appointments.discontinuePrescription);
  const renew = useMutation(api.appointments.renewPrescription);
  const updateLabStatus = useMutation(api.appointments.updateLabOrderStatus);

  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDiscontinue = async (prescriptionId: Id<"prescriptions">, drug: string) => {
    if (!confirm(`Discontinue ${drug}?`)) return;
    setBusyId(prescriptionId);
    try {
      await discontinue({ prescriptionId });
      toast.success(`${drug} discontinued`);
    } catch (err) {
      toast.error("Failed to discontinue prescription");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleRenew = async (prescriptionId: Id<"prescriptions">, drug: string) => {
    setBusyId(prescriptionId);
    try {
      await renew({ sourcePrescriptionId: prescriptionId });
      toast.success(`${drug} renewed`);
    } catch (err) {
      toast.error("Failed to renew prescription");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleAdvanceLab = async (
    labOrderId: Id<"labOrders">,
    next: "collected" | "resulted" | "reviewed",
  ) => {
    setBusyId(labOrderId);
    try {
      await updateLabStatus({ labOrderId, status: next });
    } catch (err) {
      toast.error("Failed to update lab status");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const isLoading = prescriptions === undefined || allLabOrders === undefined;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            Active medications
            {prescriptions && prescriptions.length > 0 ? ` (${prescriptions.length})` : ""}
          </h3>
        </div>
        {isLoading ? (
          <div className="py-2"><Spinner /></div>
        ) : prescriptions && prescriptions.length > 0 ? (
          <ul className="space-y-2">
            {prescriptions.map((rx) => (
              <li key={rx._id} className="text-xs rounded-md border bg-background p-2 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{rx.drug}</p>
                    <p className="text-muted-foreground">
                      {rx.count} {rx.unit} — {rx.posology}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title="Renew"
                      disabled={busyId === rx._id}
                      onClick={() => handleRenew(rx._id, rx.drug)}
                    >
                      {busyId === rx._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      title="Discontinue"
                      disabled={busyId === rx._id}
                      onClick={() => handleDiscontinue(rx._id, rx.drug)}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No active medications.</p>
        )}
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            Pending labs
            {pendingLabs && pendingLabs.length > 0 ? ` (${pendingLabs.length})` : ""}
          </h3>
        </div>
        {isLoading ? (
          <div className="py-2"><Spinner /></div>
        ) : pendingLabs && pendingLabs.length > 0 ? (
          <ul className="space-y-2">
            {pendingLabs.map((order) => (
              <li key={order._id} className="text-xs rounded-md border bg-background p-2 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{order.examName}</p>
                    <p className="text-muted-foreground capitalize">{order.status}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {order.status === "ordered" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px]"
                        disabled={busyId === order._id}
                        onClick={() => handleAdvanceLab(order._id, "collected")}
                      >
                        Mark collected
                      </Button>
                    )}
                    {order.status === "collected" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px]"
                        disabled={busyId === order._id}
                        onClick={() => handleAdvanceLab(order._id, "resulted")}
                      >
                        Mark resulted
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No pending labs.</p>
        )}
      </div>
    </div>
  );
}
