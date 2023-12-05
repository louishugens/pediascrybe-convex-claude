
import EditAppointment from "@/components/editAppointment";
import prisma from "@/utils/prisma";
import {createServerClient} from '@/utils/supabase-server'

async function getAppointment(appointmentId){
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment
}





const EditAppointmentPage = async ({params: {patientId, appointmentId}}) => {
  const supabase = createServerClient()
  
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


