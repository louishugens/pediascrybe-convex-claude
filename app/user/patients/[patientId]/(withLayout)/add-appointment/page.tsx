import AddAppointment from '@/components/add-appointment'
import prisma from '@/utils/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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

export default async function Appointment(props) {
  const params = await props.params;

  const {
    patientId
  } = params;

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id

  if (!doctorId) {
    redirect('/user/login')
  }

  const patient = await getPatient(patientId)

  return (
    <AddAppointment doctorId={doctorId} patientId={patientId} patient={patient} />
  )
}
