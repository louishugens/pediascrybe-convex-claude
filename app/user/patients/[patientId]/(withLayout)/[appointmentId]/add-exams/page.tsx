
import prisma from '@/utils/prisma';
import AddExams from "@/components/addExams";

async function getAppointment(appointmentId){
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



const AddExamsPage = async props => {
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