import React from 'react'
import prisma from '@/utils/prisma'
import AppointmentPageComponent from '@/components/appointmentPageComponent'
import { createClient } from '@/utils/supabase/server'
import { Appointment, File } from '@prisma/client'

interface AppointmentwithFiles extends Appointment{
  uploadedFiles: File[]
}

async function getAppointment(appointmentId){
  
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
    include:{
      uploadedFiles:true
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
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id
  const appointment = await getAppointment(appointmentId)

  return (
    <AppointmentPageComponent appointment={appointment as AppointmentwithFiles}  patientId={patientId} data-superjson />
  )
}

export default AppointmentPage