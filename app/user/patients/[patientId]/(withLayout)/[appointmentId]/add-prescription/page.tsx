
import prisma from '@/utils/prisma';
import AddPrescriptions from '@/components/addPrescriptions';

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

const AddPrescriptionsPage = async (props: { params: Params }) => {
  const params = await props.params;

  const {
    patientId,
    appointmentId
  } = params;

  const appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)

  if (!appointment || !patient) {
    return <div>Appointment or patient not found.</div>
  }

  return (
    <AddPrescriptions appointment={appointment} patient={patient} patientId={patientId} data-superjson />
  )
}

export default AddPrescriptionsPage