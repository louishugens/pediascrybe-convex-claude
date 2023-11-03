import { headers } from "next/headers";
import Link from "next/link";
import prisma from "@/utils/prisma";
import ReceiptList from "@/components/receiptList";

async function getReceipts(patientId:string) {

  const receipts = prisma.receipt.findMany({
    where:{
      patientId: patientId
    }
  })
  return receipts
}
const ReceiptsPage = async ({params:{patientId}}) => {
  const receipts = await getReceipts(patientId)
  const headersList = headers()
  const locale = headersList.get('accept-language')
  console.log('locale :>> ', locale);
  console.log('receipts :>> ', receipts);
  return (  
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-row w-full h-auto gap-4'>
        <Link href={`/user/patients/${patientId}`} className="mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start">Leave</Link>
      </div>
      <div className="flex flex-row w-full justify-between mt-4">
        <p className=' font-bold text-white'><span className=' text-primary'>Receipt list</span></p>
        <Link 
        className='self-end px-4 py-2 bg-blue-500 text-white rounded-full text-sm' 
        href={`/user/patients/${patientId}/receipts/create-receipt`}>Create Receipt</Link>
      </div>
      <ReceiptList receipts={receipts} patientId={patientId} />
    </div>
  );
}
 
export default ReceiptsPage;