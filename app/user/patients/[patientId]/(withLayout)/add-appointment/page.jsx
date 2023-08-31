import AddAppointment from '@/components/addAppointment'
import prisma from '@/utils/prisma'

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

// export const runtime = 'edge'

export default async function Appointment({params: {doctorId, patientId}}) {

  const patient = await getPatient(patientId)

  return (
    <AddAppointment doctorId={doctorId} patientId={patientId} patient={patient} />
  )
}
