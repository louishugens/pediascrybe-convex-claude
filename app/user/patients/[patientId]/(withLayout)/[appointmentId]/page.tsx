import React from 'react'
import AppointmentPageComponent from '@/components/appointmentPageComponent'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { File, Service, AppointmentSelect, Appointment } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface AppointmentwithFiles extends AppointmentSelect{
  uploadedFiles: File[]
  service: Service | null
}

async function getAppointment(appointmentId){
  
  const appointment = await db.query.Appointment.findFirst({
    where:eq(Appointment.id, appointmentId),
    with:{
      uploadedFiles:true,
      service:true,
    }
  })
  return appointment
}

type Params = Promise<{ patientId: string, appointmentId: string }>

const AppointmentPage = async (props: { params: Params }) => {
  const params = await props.params;

  const {
    patientId,
    appointmentId
  } = params;

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id
  const appointment = await getAppointment(appointmentId)

  return (
    <AppointmentPageComponent appointment={appointment as AppointmentwithFiles}  patientId={patientId} data-superjson />
  )
}

export default AppointmentPage