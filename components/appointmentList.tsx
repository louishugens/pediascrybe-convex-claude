import { Suspense, ViewTransition } from "react"
import { getPatientAppointments } from "@/data/queries"
import AppointmentComponent from "./appointment"
import { cacheTag } from "next/cache"
import AppointmentListSkeleton from "./appointmentListSkeleton"

export default async function AppointmentList({ patientId }: { patientId: string }) {
  "use cache"
  cacheTag(`patient-appointments-${patientId}`)
  const appointments = await getPatientAppointments(patientId)

  return (
    <ViewTransition>
      <Suspense fallback={<AppointmentListSkeleton />}>
        {appointments.map(appointment => <AppointmentComponent appointment={appointment} patientId={patientId} data-superjson key={appointment.id} />
        )}
      </Suspense>
    </ViewTransition>
  )
}
