
import prisma from '@/utils/prisma';
import AddPrescriptions from '@/components/addPrescriptions';

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



const AddPrescriptionsPage = async props => {
  const params = await props.params;

  const {
    patientId,
    appointmentId
  } = params;

  const appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)

  return (
    <AddPrescriptions appointment={appointment} patient={patient} patientId={patientId} data-superjson />
  )
}

export default AddPrescriptionsPage