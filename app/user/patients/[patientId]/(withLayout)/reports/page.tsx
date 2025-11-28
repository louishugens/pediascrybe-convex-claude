import ReportList from "@/components/reportList";
import ReportsSkeleton from "@/components/skeletons/reports-skeleton";
import Link from "next/link";
import prisma from "@/utils/prisma";
import { Suspense, ViewTransition } from "react";

async function getReports(patientId: string) {

  const reports = prisma.report.findMany({
    where: {
      patientId: patientId
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  return reports
}

type Params = Promise<{ patientId: string }>

const ReportsPage = async (props: { params: Params }) => {

  return (
    <ViewTransition>
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  );
}

export default ReportsPage;

async function ReportsContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId } = await params;

  const reports = await getReports(patientId)
  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-row w-full h-auto gap-4'>
        <Link href={`/user/patients/${patientId}`} className="mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start">Leave</Link>
      </div>
      <div className="flex flex-row w-full justify-between mt-4">
        <p className=' font-bold text-white'><span className=' text-primary'>Reports and Certificates list</span></p>
        <Link
          className='self-end px-4 py-2 bg-blue-500 text-white rounded-full text-sm'
          href={`/user/patients/${patientId}/reports/create-report`}>Create Report</Link>
      </div>
      <ReportList reports={reports} patientId={patientId} />
    </div>
  )
}