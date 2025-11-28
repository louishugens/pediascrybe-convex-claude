// Force update
import CreateReceiptForm from './create-receipt-form';
import ReceiptFormSkeleton from '@/components/skeletons/receipt-form-skeleton';
import { Suspense, ViewTransition } from "react";
import Link from "next/link";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

type Params = Promise<{ patientId: string }>

export default async function CreateReceiptPage(props: { params: Params }) {
  return (
    <ViewTransition>
      <Suspense fallback={<ReceiptFormSkeleton />}>
        <CreateReceiptContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  );
}

async function CreateReceiptContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId } = await params;

  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-row w-full h-auto gap-4 justify-end px-4'>
        <Link href={`/user/patients/${patientId}/receipts`} className='text-black bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors'>
          <ArrowUturnLeftIcon className='w-4 h-4' />
        </Link>
      </div>
      <CreateReceiptForm patientId={patientId} />
    </div>
  )
}
