
import EditAppointment from "@/components/editAppointment";
import prisma from "@/utils/prisma";
// import {createServerClient} from '@/utils/supabase-server'
// import supabase from '@/utils/supabase-ssr'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAppointment(appointmentId){
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment
}





const EditAppointmentPage = async ({params: {patientId, appointmentId}}) => {
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
    <EditAppointment appointment={appointment} doctorId={doctorId} patientId={patientId} data-superjson />
  )
}

export default EditAppointmentPage


