import CreateReport from "@/components/createReport";
import ReportFormSkeleton from "@/components/skeletons/report-form-skeleton";
import { Suspense, ViewTransition } from "react";
import Link from "next/link";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string }>

const CreateReportPage = async (props: { params: Params }) => {
  return (
    <ViewTransition>
      <Suspense fallback={<ReportFormSkeleton />}>
        <CreateReportContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  );
}

export default CreateReportPage;

async function CreateReportContainer({ params }: { params: Params }) {
  const { patientId } = await params;

  const [patient, records] = await Promise.all([
    fetchAuthQuery(api.patients.getPatient, { 
      patientId: patientId as Id<"patients"> 
    }),
    fetchAuthQuery(api.appointments.getPatientAppointments, { 
      patientId: patientId as Id<"patients"> 
    }),
  ]);

  if (!patient) {
    return <div>Patient not found</div>;
  }
  
  return (
    <div className='h-full mb-4'>
      <div className='flex flex-row w-full h-auto gap-4 justify-end px-4'>
        <Link href={`/user/patients/${patientId}/reports`} className='text-black bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors'>
          <ArrowUturnLeftIcon className='w-4 h-4' />
        </Link>
      </div>
      <CreateReport patientId={patientId as Id<"patients">} patient={patient} records={records} />
    </div>
  )
}
