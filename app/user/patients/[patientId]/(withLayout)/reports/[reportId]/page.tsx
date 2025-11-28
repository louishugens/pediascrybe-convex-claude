import Print from "@/components/printReport";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'
import { Suspense } from "react";

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

type Params = Promise<{ patientId: string, reportId: string }>

const ReportPage = async (props: { params: Params }) => {

  return ( 
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <ReportContainer params={props.params} />
      </Suspense>
    </>
   );
}
 
export default ReportPage;

async function ReportContainer({ params }: { params: Params }) {


  const {
    patientId,
    reportId
  } = await params;

  const supabase = await createClient()


  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id
  const doctor = await getDoctor(doctorId!)
  const report = await getReport(reportId)
  const patient = await getPatient(patientId)

  return (
    <Print doctor={doctor!} patient={patient!} report={report!} />
  )
}