import EditPatient from "@/components/editPatient";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'
import { Suspense } from "react";

async function getPatient(patientId) {
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId
    },
  })
  return patient
}

type Params = Promise<{ patientId: string }>

const EditPatientPage = async ({ params }: { params: Params }) => {


  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditPatientContainer params={params} />
    </Suspense>
  )
}

export default EditPatientPage

async function EditPatientContainer({ params }: { params: Params }) {

  const { patientId } = await params;
  const patient = await getPatient(patientId)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id
  if (!patient || !doctorId) {
    return <div>Patient or doctor not found</div>
  }
  return (
    <EditPatient patient={patient} doctorId={doctorId} data-superjson />
  )
}