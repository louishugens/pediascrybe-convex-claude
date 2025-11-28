import EditReceipt from "@/components/editReceipt";
import prisma from "@/utils/prisma";
import { Suspense } from "react";

async function getReceipt(receiptId: string){
  const receipt = await prisma.receipt.findUnique({
    where: {
      id: receiptId
    }
  })
  return receipt
}

type Params = Promise<{ patientId: string, receiptId: string }>

const EditReceiptPage = async (props: { params: Params }) => {
  // const params = await props.params;
  // const {
  //   patientId,
  //   receiptId
  // } = params;


  return ( 
    <>  
      <Suspense fallback={<div>Loading...</div>}>
        <EditReceiptContainer params={props.params} />
      </Suspense>
    </>
   );
}
 
export default EditReceiptPage;

async function EditReceiptContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId, receiptId } = await params;

  const receipt = await getReceipt(receiptId)
  return (
    <EditReceipt patientId={patientId} receipt={receipt!} />
  )
}