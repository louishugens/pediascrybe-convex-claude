
import EditPatient from "@/components/editPatient";
import prisma from "@/utils/prisma";
// import {createServerClient} from '@/utils/supabase-server'
// import supabase from '@/utils/supabase-ssr'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getPatient(patientId){
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
  })
  return patient
}

// export const dynamic = 'force-dynamic';

const EditPatientPage = async ({params: { patientId}}) => {
  // const supabase = createServerClient()
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
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