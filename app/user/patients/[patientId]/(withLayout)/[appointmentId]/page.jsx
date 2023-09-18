import React from 'react'
import prisma from '@/utils/prisma'
import AppointmentPageComponent from '@/components/appointmentPageComponent'
import {createServerClient} from '@/utils/supabase-server'


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
export const dynamic = 'force-dynamic';
const AppointmentPage = async ({params: { patientId, appointmentId}}) => {
  const supabase = createServerClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id
  const appointment = await getAppointment(appointmentId)
  return (
    <AppointmentPageComponent appointment={appointment} doctorId={doctorId} patientId={patientId} data-superjson />
  )
}

export default AppointmentPage