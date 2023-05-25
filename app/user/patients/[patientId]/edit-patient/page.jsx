import EditPatient from "@/components/editPatient";
import prisma from "@/utils/prisma";
import {createServerClient} from '@/utils/supabase-server'
async function getPatient(patientId){
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
  })
  return patient
}

export const dynamic = 'force-dynamic';

const EditPatientPage = async ({params: { patientId}}) => {
  const supabase = createServerClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id
  const patient = await getPatient(patientId)

  return (
    <EditPatient patient={patient} doctorId={doctorId} />
  )
}

export default EditPatientPage