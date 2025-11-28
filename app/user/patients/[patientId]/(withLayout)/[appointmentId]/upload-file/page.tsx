import { Suspense, ViewTransition } from "react";
import GenericFormSkeleton from "@/components/skeletons/generic-form-skeleton";
import UploadForm from "./upload-form";
import Link from "next/link";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

type Params = Promise<{ patientId: string, appointmentId: string }>

export default async function UploadPage(props: { params: Params }) {
  return (
    <ViewTransition>
      <Suspense fallback={<GenericFormSkeleton />}>
        <UploadPageContent params={props.params} />
      </Suspense>
    </ViewTransition>
  )
}

async function UploadPageContent({ params }: { params: Params }) {
  const { patientId, appointmentId } = await params;
  return (
    <div>
      <div className='flex flex-row w-full h-auto gap-4 justify-end px-4 mb-4 mt-4'>
        <Link href={`/user/patients/${patientId}/${appointmentId}`} className='text-black bg-slate-50 p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors'>
          <ArrowUturnLeftIcon className='w-4 h-4' />
        </Link>
      </div>
      <UploadForm patientId={patientId} appointmentId={appointmentId} />
    </div>
  )
}
