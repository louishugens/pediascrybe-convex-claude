import EditReceipt from "@/components/editReceipt";
import ReceiptFormSkeleton from '@/components/skeletons/receipt-form-skeleton';
import { Suspense, ViewTransition } from "react";
import Link from "next/link";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string, receiptId: string }>

const EditReceiptPage = async (props: { params: Params }) => {
  return (
    <ViewTransition>
      <Suspense fallback={<ReceiptFormSkeleton />}>
        <EditReceiptContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  );
}

export default EditReceiptPage;

async function EditReceiptContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId, receiptId } = await params;

  const receipt = await fetchAuthQuery(api.receipts.getReceipt, { 
    receiptId: receiptId as Id<"receipts"> 
  });
  
  if (!receipt) {
    return <div>Receipt not found</div>;
  }
  
  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-row w-full h-auto gap-4 justify-end px-4'>
        <Link href={`/user/patients/${patientId}/receipts`} className='text-black bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors'>
          <ArrowUturnLeftIcon className='w-4 h-4' />
        </Link>
      </div>
      <EditReceipt patientId={patientId} receipt={receipt} />
    </div>
  )
}
