import EditPatient from "@/components/editPatient";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'

async function getPatient(patientId){
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
  })
  return patient
}

type Params = Promise<{ patientId: string }>

const EditPatientPage = async ({ params }: { params: Params }) => {
  const { patientId } = await params;

  const supabase = await createClient()

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