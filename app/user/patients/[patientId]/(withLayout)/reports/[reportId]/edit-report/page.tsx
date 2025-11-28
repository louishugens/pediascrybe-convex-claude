import EditReport from "@/components/editReport";
import prisma from "@/utils/prisma";
import { Suspense } from "react";

async function getReport(reportId: string){
  const report = await prisma.report.findUnique({
    where: {
      id: reportId
    }
  })
  return report
}

type Params = Promise<{ patientId: string, reportId: string }>

const EditReportPage = async (props: { params: Params }) => {
  // const params = await props.params;

  // const {
  //   patientId,
  //   reportId
  // } = params;

  // const report = await getReport(reportId)
  
  return ( 
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <EditReportContainer params={props.params} />
      </Suspense>
    </>
   );
}
 
export default EditReportPage;

async function EditReportContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId, reportId } = await params;

  const report = await getReport(reportId)
  return (
    <EditReport patientId={patientId} report={report!} />
  )
}