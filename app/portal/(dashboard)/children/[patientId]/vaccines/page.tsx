"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Spinner } from "@/components/ui/spinner"
import VaccineTrackingDashboard from "@/components/patient/vaccine-tracking-dashboard"
import { format } from "date-fns"
import { Syringe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AIExplainerCard } from "@/components/portal/ai-explainer-card"

export default function VaccinesPage() {
  const params = useParams()
  const patientId = params.patientId as Id<"patients">

  const compliance = useQuery(api.portal.getPatientVaccineCompliance, { patientId })
  const records = useQuery(api.portal.getPatientVaccinations, { patientId })

  if (compliance === undefined || records === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Vaccination Records</h2>
        <p className="text-sm text-muted-foreground">
          Track your child&apos;s vaccination progress and compliance
        </p>
      </div>

      {/* Vaccine Tracking Dashboard (reuse existing component) */}
      {compliance.vaccines.length > 0 ? (
        <VaccineTrackingDashboard
          patientId={patientId}
          birthdate={compliance.patient.birthdate}
          vaccines={compliance.vaccines}
          records={compliance.records}
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Syringe className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No vaccines configured by the doctor yet.</p>
        </div>
      )}

      {/* Vaccination Records List */}
      {records.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Administered Vaccines ({records.length})
          </h3>
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record._id}
                className="rounded-lg border border-border/50 bg-card/50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {record.vaccin?.name || "Unknown Vaccine"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.dose?.doseType ? `${record.dose.doseType}` : ""} - {format(new Date(record.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {record.route}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {record.manufacturer && <p>Manufacturer: {record.manufacturer}</p>}
                  {record.lotNumber && <p>Lot #: {record.lotNumber}</p>}
                  {record.dosage && <p>Dosage: {record.dosage}</p>}
                  {record.site && <p>Site: {record.site}</p>}
                </div>
                <div className="mt-3">
                  <AIExplainerCard
                    type="vaccination"
                    context={{
                      vaccineName: record.vaccin?.name || "Unknown",
                      doseType: record.dose?.doseType,
                      date: record.date,
                      route: record.route,
                      manufacturer: record.manufacturer,
                      notes: record.notes,
                    }}
                    patientId={patientId}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
