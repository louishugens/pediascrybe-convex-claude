'use client'
import { Receipt } from "@prisma/client";
import ReceiptItem from "./receiptItem";

interface Props {
  receipts: Receipt[]
  patientId: String
  lang: string
}
const ReportList = ({receipts, patientId, lang}: Props) => {

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
      {receipts.map(receipt =>{
        return(
          <ReceiptItem patientId={patientId} receipt={receipt} key={receipt.id} lang={lang} />
        )}
      )}
    </tbody>
  </table>
   );
}
 
export default ReportList;