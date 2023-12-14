import Print from "@/components/printReport";
import prisma from "@/utils/prisma";
// import {createServerClient} from '@/utils/supabase-server'
// import supabase from "@/utils/supabase-ssr";
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getPatient(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
  })
  return patient
}

async function getDoctor(doctorId:string) {
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
  })
  return doctor
}

async function getReport(id:string) {

  const report = prisma.report.findUnique({
    where:{
      id: id
    }
  })
  return report
}

const ReportPage = async ({params:{patientId, reportId}}) => {
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
  const doctor = await getDoctor(doctorId!)
  const report = await getReport(reportId)
  const patient = await getPatient(patientId)

  return ( 
    <>
      <Print doctor={doctor!} patient={patient!} report={report!} />
    </>
   );
}
 
export default ReportPage;