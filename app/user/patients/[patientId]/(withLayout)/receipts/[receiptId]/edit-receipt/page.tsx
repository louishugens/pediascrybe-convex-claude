import EditReceipt from "@/components/editReceipt";
import prisma from "@/utils/prisma";

async function getReceipt(receiptId){
  const receipt = await prisma.receipt.findUnique({
    where: {
      id: receiptId
    }
  })
  return receipt
}
const EditReceiptPage = async props => {
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