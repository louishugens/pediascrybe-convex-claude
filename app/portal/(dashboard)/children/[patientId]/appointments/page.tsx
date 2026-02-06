"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Spinner } from "@/components/ui/spinner"
import { AppointmentTimeline } from "@/components/portal/appointment-timeline"

export default function AppointmentsPage() {
  const params = useParams()
  const patientId = params.patientId as Id<"patients">

  const appointments = useQuery(api.portal.getPatientAppointments, { patientId })

  if (appointments === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Appointments</h2>
        <p className="text-sm text-muted-foreground">
          {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} recorded
        </p>
      </div>

      <AppointmentTimeline appointments={appointments} patientId={patientId} />
    </div>
  )
}
