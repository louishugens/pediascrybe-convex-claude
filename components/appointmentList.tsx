import { getPatientAppointments } from "@/data/queries"
import AppointmentComponent from "./appointment"
import { cacheTag } from "next/cache"

export default async function AppointmentList({patientId}: {patientId: string}) {
  "use cache"
  cacheTag(`patient-appointments-${patientId}`)
  const appointments = await getPatientAppointments(patientId)

  return (
    <>
    {appointments.map(appointment => <AppointmentComponent appointment={appointment} patientId={patientId} data-superjson key={appointment.id} />
            )}
    </>
  )
}
