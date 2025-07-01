
import EditAppointment from "@/components/editAppointment";
import prisma from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";

async function getAppointment(appointmentId: string){
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment
}

type Params = Promise<{ patientId: string, appointmentId: string }>

const EditAppointmentPage = async (props: { params: Params }) => {
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
    <EditAppointment appointment={appointment} doctorId={doctorId} patientId={patientId} data-superjson />
  )
}

export default EditAppointmentPage


