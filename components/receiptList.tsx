'use client'
import ReceiptItem from "./receiptItem";
import { Id } from "@/convex/_generated/dataModel";

interface Receipt {
  _id: Id<"receipts">;
  createdAt: number;
  services?: any;
  totalPrice?: number | null;
}

interface Props {
  receipts: Receipt[]
  patientId: string
  lang: string
}

const ReceiptList = ({receipts, patientId, lang}: Props) => {
  return ( 
    <table className="table-auto color-0 rounded-lg relative text-sm w-full mt-4 border-separate border-spacing-y-1.5">
    <thead className="rounded-t-lg  bg-blue-50">
      <tr className="rounded-full shadow">
        <th className="text-left px-4 py-2 rounded-l-full">Date</th>
        <th className="text-left px-4 py-2">Services</th>
        <th className="text-left px-4 py-2">Cost</th>
        <th className="text-left px-4 py-2 rounded-r-full">Actions</th>
      </tr>
    </thead>
    <tbody className='w-full'>
      {receipts.map(receipt => {
        return(
          <ReceiptItem patientId={patientId} receipt={receipt} key={receipt._id} lang={lang} />
        )}
      )}
    </tbody>
  </table>
   );
}
 
export default ReceiptList;
