import React, { Suspense, ViewTransition } from 'react'
import AppointmentPageComponent from '@/components/appointmentPageComponent'
import AppointmentPageSkeleton from '@/components/appointment-page-skeleton'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { File, Service, AppointmentSelect, Appointment } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface AppointmentwithFiles extends AppointmentSelect {
  uploadedFiles: File[]
  service: Service | null
}

async function getAppointment(appointmentId) {

  const appointment = await db.query.Appointment.findFirst({
    where: eq(Appointment.id, appointmentId),
    with: {
      uploadedFiles: true,
      service: true,
    }
  })

  return appointment
}

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
  'use cache'
  const { patientId, appointmentId } = await params;

  const appointment = await getAppointment(appointmentId)
  return (
    <AppointmentPageComponent appointment={appointment as AppointmentwithFiles} patientId={patientId} data-superjson />
  )
}