
import prisma from '@/utils/prisma';
import AddPrescriptions from '@/components/addPrescriptions';
import {createServerClient} from '@/utils/supabase-server'

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



export const dynamic = 'force-dynamic';


const AddPrescriptionsPage = async ({params: {patientId, appointmentId}}) => {
  const supabase = createServerClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id

  const appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)

  return (
    <AddPrescriptions appointment={appointment} patient={patient} patientId={patientId} data-superjson />
  )
}

export default AddPrescriptionsPage