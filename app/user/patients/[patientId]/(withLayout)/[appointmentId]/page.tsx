import React, { Suspense, ViewTransition } from 'react'
import AppointmentPageComponent from '@/components/appointmentPageComponent'
import AppointmentPageSkeleton from '@/components/appointment-page-skeleton'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

type Params = Promise<{ patientId: string, appointmentId: string }>

const AppointmentPage = async (props: { params: Params }) => {
  return (
    <ViewTransition>
      <Suspense fallback={<AppointmentPageSkeleton />}>
        <AppointmentPageContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  )
}

export default AppointmentPage

async function AppointmentPageContainer({ params }: { params: Params }) {
  const { patientId, appointmentId } = await params;

  const appointment = await fetchAuthQuery(api.appointments.getAppointmentWithFiles, {
    appointmentId: appointmentId as Id<"appointments">
  })

  if (!appointment) {
    return <div>Appointment not found</div>
  }

  return (
    <AppointmentPageComponent appointment={appointment} patientId={patientId as Id<"patients">} />
  )
}
