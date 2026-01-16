import { headers } from "next/headers";
import Link from "next/link";
import ReceiptList from "@/components/receiptList";
import ReceiptsSkeleton from "@/components/skeletons/receipts-skeleton";
import { Suspense, ViewTransition } from "react";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string }>

const ReceiptsPage = async (props: { params: Params }) => {
  return (
    <ViewTransition>
      <Suspense fallback={<ReceiptsSkeleton />}>
        <ReceiptsContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  );
}

export default ReceiptsPage;

async function ReceiptsContainer({ params }: { params: Params }) {
  const { patientId } = await params;

  const receipts = await fetchAuthQuery(api.receipts.listByPatient, { 
    patientId: patientId as Id<"patients"> 
  });
  const headersList = await headers()
  const locale = headersList.get('accept-language')
  const lang = locale?.split(',')[0]

  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-row w-full h-auto gap-4'>
        <Link href={`/user/patients/${patientId}`} className="mt-4 text-sm text-primary bg-muted rounded-full px-4 py-2 self-start">Leave</Link>
      </div>
      <div className="flex flex-row w-full justify-between mt-4">
        <p className=' font-bold text-white'><span className=' text-primary'>Receipt list</span></p>
        <Link
          className='self-end px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm'
          href={`/user/patients/${patientId}/receipts/create-receipt`}>Create Receipt</Link>
      </div>
      <ReceiptList receipts={receipts} patientId={patientId} lang={lang!} />
    </div>
  );
}
