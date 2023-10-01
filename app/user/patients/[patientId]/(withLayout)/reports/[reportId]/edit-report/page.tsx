import EditReport from "@/components/editReport";
import prisma from "@/utils/prisma";

async function getReport(reportId){
  const report = await prisma.report.findUnique({
    where: {
      id: reportId
    }
  })
  return report
}
const EditReportPage = async ({params:{patientId, reportId}}) => {
  const report = await getReport(reportId)
  return ( 
    <>
      <EditReport patientId={patientId} report={report!} />
    </>
   );
}
 
export default EditReportPage;