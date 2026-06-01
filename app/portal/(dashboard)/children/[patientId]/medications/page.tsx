"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import { Pill, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function PortalMedicationsPage() {
  const params = useParams();
  const patientId = params.patientId as Id<"patients">;

  const medications = useQuery(api.portal.getActiveMedications, { patientId });

  if (medications === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Pill className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Active medications</h2>
          <p className="text-sm text-muted-foreground">
            Currently prescribed medications across all visits.
          </p>
        </div>
      </div>

      {medications.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed">
          <Pill className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No active medications.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {medications.map((rx) => (
            <li key={rx._id} className="rounded-xl border border-border/50 bg-card/50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {rx.drug}
                    {rx.count ? `, ${rx.count} ${rx.unit ?? ""}` : ""}
                  </p>
                  {rx.dose && (
                    <p className="text-sm text-muted-foreground">Dose: {rx.dose}</p>
                  )}
                  {rx.posology && (
                    <p className="text-sm text-muted-foreground mt-1">{rx.posology}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                    <span>Prescribed by {rx.doctorName}</span>
                    <span>·</span>
                    <span>{format(rx.createdAt, "MMM d, yyyy")}</span>
                    {rx.endDate && (
                      <>
                        <span>·</span>
                        <span>Ends {format(rx.endDate, "MMM d, yyyy")}</span>
                      </>
                    )}
                  </div>
                </div>
                {rx.appointmentId && (
                  <Link
                    href={`/portal/children/${patientId}/appointments/${rx.appointmentId}` as any}
                    className="inline-flex items-center gap-1 text-xs text-primary shrink-0"
                  >
                    <Calendar className="h-3 w-3" />
                    Visit
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
