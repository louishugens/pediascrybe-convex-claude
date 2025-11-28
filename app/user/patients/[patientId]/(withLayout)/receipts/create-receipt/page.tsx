// Force update
import CreateReceiptForm from './create-receipt-form';
import { Suspense } from "react";

type Params = Promise<{ patientId: string }>

export default async function CreateReceiptPage(props: { params: Params }) {
  // const params = await props.params;
  // const { patientId } = params;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateReceiptContainer params={props.params} />
    </Suspense>
  );
}

async function CreateReceiptContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId } = await params;


  return (
    <CreateReceiptForm patientId={patientId} />
  )
}
