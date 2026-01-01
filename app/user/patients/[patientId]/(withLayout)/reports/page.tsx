import ReportList from "@/components/reportList";
import ReportsSkeleton from "@/components/skeletons/reports-skeleton";
import Link from "next/link";
import { Suspense, ViewTransition } from "react";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
  const { patientId } = await params;

  const reports = await fetchAuthQuery(api.reports.listByPatient, { 
    patientId: patientId as Id<"patients"> 
  });
  
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
