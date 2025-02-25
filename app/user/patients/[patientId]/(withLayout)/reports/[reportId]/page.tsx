import Print from "@/components/printReport";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'

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

const ReportPage = async props => {
  const params = await props.params;

  const {
    patientId,
    reportId
  } = params;

  const supabase = await createClient()


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