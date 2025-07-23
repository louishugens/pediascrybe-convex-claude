import EditAppointment from "@/components/edit-appointment";
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

async function getPatient(patientId) {
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
    include: {
      appointments: true,
    },
  })

  return patient
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
  const patient = await getPatient(patientId)

  return (
    <EditAppointment appointment={appointment} patientId={patientId} patient={patient} data-superjson />
  )
}

export default EditAppointmentPage


