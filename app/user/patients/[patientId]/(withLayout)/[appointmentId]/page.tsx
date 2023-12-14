import React from 'react'
import prisma from '@/utils/prisma'
import AppointmentPageComponent from '@/components/appointmentPageComponent'
// import {createServerClient} from '@/utils/supabase-server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
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
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

const AppointmentPage = async ({params: { patientId, appointmentId}}) => {
  // const supabase = createServerClient()
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
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