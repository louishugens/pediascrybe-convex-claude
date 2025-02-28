import EditReceipt from "@/components/editReceipt";
import prisma from "@/utils/prisma";

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
  const params = await props.params;

  const {
    patientId,
    receiptId
  } = params;

  const receipt = await getReceipt(receiptId)
  return ( 
    <>
      <EditReceipt patientId={patientId} receipt={receipt!} />
    </>
   );
}
 
export default EditReceiptPage;