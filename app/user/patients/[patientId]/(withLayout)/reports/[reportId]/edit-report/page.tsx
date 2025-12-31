import EditReport from "@/components/editReport";
import ReportFormSkeleton from "@/components/skeletons/report-form-skeleton";
import { Suspense, ViewTransition } from "react";
import Link from "next/link";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string, reportId: string }>

const EditReportPage = async (props: { params: Params }) => {
  return (
    <ViewTransition>
      <Suspense fallback={<ReportFormSkeleton />}>
        <EditReportContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  );
}

export default EditReportPage;

async function EditReportContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId, reportId } = await params;

  const report = await fetchAuthQuery(api.reports.getReport, { 
    reportId: reportId as Id<"reports"> 
  });
  
  if (!report) {
    return <div>Report not found</div>;
  }
  
  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-row w-full h-auto gap-4 justify-end px-4'>
        <Link href={`/user/patients/${patientId}/reports`} className='text-black bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors'>
          <ArrowUturnLeftIcon className='w-4 h-4' />
        </Link>
      </div>
      <EditReport patientId={patientId} report={report} />
    </div>
  )
}
