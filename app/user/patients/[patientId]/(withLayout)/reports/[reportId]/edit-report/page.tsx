import EditReport from "@/components/editReport";
import ReportFormSkeleton from "@/components/skeletons/report-form-skeleton";
import prisma from "@/utils/prisma";
import { Suspense, ViewTransition } from "react";
import Link from "next/link";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

async function getReport(reportId: string) {
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

  // const {
  //   patientId,
  //   reportId
  // } = params;

  // const report = await getReport(reportId)

  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-row w-full h-auto gap-4 justify-end px-4'>
        <Link href={`/user/patients/${params.patientId}/reports`} className='text-black bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors'>
          <ArrowUturnLeftIcon className='w-4 h-4' />
        </Link>
      </div>
      <ViewTransition>
        <Suspense fallback={<ReportFormSkeleton />}>
          <EditReportContainer params={props.params} />
        </Suspense>
      </ViewTransition>
    </div>
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