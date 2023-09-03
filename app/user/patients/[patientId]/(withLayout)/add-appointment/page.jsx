import AddAppointment from '@/components/addAppointment'
import prisma from '@/utils/prisma'
import {createServerClient} from '@/utils/supabase-server'

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

export default async function Appointment({params: { patientId}}) {

  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id

  const patient = await getPatient(patientId)

  return (
    <AddAppointment doctorId={doctorId} patientId={patientId} patient={patient} />
  )
}
