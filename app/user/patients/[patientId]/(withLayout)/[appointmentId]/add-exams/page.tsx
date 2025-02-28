
import prisma from '@/utils/prisma';
import AddExams from "@/components/addExams";

async function getAppointment(appointmentId: string){
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment
}

async function getPatient(patientId: string) {
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

const AddExamsPage = async (props: { params: Params }) => {
  const params = await props.params;

  const {
    patientId,
    appointmentId
  } = params;

  const appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)

  return (
    <AddExams appointment={appointment} patient={patient} patientId={patientId} data-superjson />
  )
}

export default AddExamsPage