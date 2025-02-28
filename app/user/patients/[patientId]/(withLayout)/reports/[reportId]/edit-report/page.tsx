import EditReport from "@/components/editReport";
import prisma from "@/utils/prisma";

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
  const params = await props.params;

  const {
    patientId,
    reportId
  } = params;

  const report = await getReport(reportId)
  return ( 
    <>
      <EditReport patientId={patientId} report={report!} />
    </>
   );
}
 
export default EditReportPage;