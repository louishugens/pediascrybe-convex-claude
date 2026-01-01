import { Suspense, ViewTransition } from "react"
import AppointmentComponent from "./appointment"
import AppointmentListSkeleton from "./appointmentListSkeleton"
import { fetchAuthQuery } from "@/lib/auth-server"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

export default async function AppointmentList({ patientId }: { patientId: string }) {
  const appointments = await fetchAuthQuery(api.appointments.getPatientAppointments, { 
    patientId: patientId as Id<"patients"> 
  })

  return (
    <ViewTransition>
      <Suspense fallback={<AppointmentListSkeleton />}>
        {appointments.map(appointment => <AppointmentComponent appointment={appointment} patientId={patientId} data-superjson key={appointment._id} />
        )}
      </Suspense>
    </ViewTransition>
  )
}
