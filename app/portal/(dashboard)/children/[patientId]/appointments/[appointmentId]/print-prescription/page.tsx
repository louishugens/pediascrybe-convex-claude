"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Spinner } from "@/components/ui/spinner"
import Print from "@/components/print"

export default function PortalPrintPrescriptionPage() {
  const params = useParams()
  const patientId = params.patientId as Id<"patients">
  const appointmentId = params.appointmentId as Id<"appointments">

  const appointment = useQuery(api.portal.getAppointmentDetail, { patientId, appointmentId })
  const patient = useQuery(api.portal.getPatientDetails, { patientId })
  const doctor = useQuery(api.portal.getPatientDoctor, { patientId })

  if (appointment === undefined || patient === undefined || doctor === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!appointment || !patient || !doctor) {
    return <div className="text-center py-20 text-muted-foreground">Data not found</div>
  }

  return (
    <Print
      appointment={appointment}
      patient={patient}
      doctor={doctor}
      exams={false}
      backUrl={`/portal/children/${patientId}/appointments/${appointmentId}`}
    />
  )
}
